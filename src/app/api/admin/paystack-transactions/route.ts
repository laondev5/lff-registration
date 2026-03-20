import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import DismissedTransaction from '@/models/DismissedTransaction';

const PER_PAGE = 100;

async function fetchPaystackPage(secretKey: string, page: number): Promise<PaystackPage> {
    const res = await fetch(
        `https://api.paystack.co/transaction?perPage=${PER_PAGE}&page=${page}`,
        {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
            // 30s per request
            signal: AbortSignal.timeout(30000),
        }
    );
    return res.json();
}

export async function GET() {
    try {
        const secretKey = process.env.PAYSTACK_REG_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({ error: 'Paystack registration key not configured' }, { status: 500 });
        }

        // 1. Fetch first page to discover total count
        const firstPage = await fetchPaystackPage(secretKey, 1);
        if (!firstPage.status) {
            return NextResponse.json(
                { error: firstPage.message || 'Failed to fetch from Paystack' },
                { status: 500 }
            );
        }

        const totalCount: number = firstPage.meta?.total ?? 0;
        const totalPages = Math.ceil(totalCount / PER_PAGE);

        // 2. Fetch remaining pages in parallel (batched at 10 at a time to avoid rate limits)
        let allTransactions: PaystackTransaction[] = [...(firstPage.data || [])];

        if (totalPages > 1) {
            const remainingPageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

            // Batch into groups of 10
            for (let i = 0; i < remainingPageNums.length; i += 10) {
                const batch = remainingPageNums.slice(i, i + 10);
                const results = await Promise.all(
                    batch.map((p) => fetchPaystackPage(secretKey, p))
                );
                for (const r of results) {
                    if (r.data) allTransactions = allTransactions.concat(r.data);
                }
            }
        }

        // 3. Filter to registration-type transactions only
        const regTransactions = allTransactions.filter(
            (t) =>
                t.metadata?.transaction_type === 'registration' ||
                !!t.metadata?.uniqueId ||
                !!t.metadata?.registrationData ||
                !!t.metadata?.registrationDataList
        );

        if (regTransactions.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                total: totalCount,
            });
        }

        // 4. Cross-reference with DB
        const references = regTransactions.map((t) => t.reference).filter(Boolean);
        const uniqueIdsFromMeta = regTransactions
            .map((t) => t.metadata?.uniqueId)
            .filter((id): id is string => !!id);

        await connectDB();

        const [dbByRef, dbByUid, dismissedDocs] = await Promise.all([
            Registration.find({ paymentReference: { $in: references } }).lean(),
            Registration.find({ uniqueId: { $in: uniqueIdsFromMeta } }).lean(),
            DismissedTransaction.find({ reference: { $in: references } }).lean(),
        ]);

        const dismissedSet = new Set(dismissedDocs.map((d: { reference: string }) => d.reference));

        const refMap: Record<string, DBRegistration> = {};
        for (const r of dbByRef) refMap[(r as DBRegistration).paymentReference] = r as DBRegistration;

        const uidMap: Record<string, DBRegistration> = {};
        for (const r of dbByUid) uidMap[(r as DBRegistration).uniqueId] = r as DBRegistration;

        // 5. Build result (skip dismissed entries)
        const result = regTransactions
            .filter((t) => !dismissedSet.has(t.reference))
            .map((t) => {
                const dbReg =
                    refMap[t.reference] ||
                    uidMap[t.metadata?.uniqueId || ''] ||
                    null;

                const registrationDataList = t.metadata?.registrationDataList;
                const isBulk = !!registrationDataList;

                const fullName =
                    dbReg?.fullName ||
                    t.metadata?.registrationData?.fullName ||
                    (registrationDataList?.[0]?.fullName
                        ? `${registrationDataList[0].fullName}${registrationDataList.length > 1 ? ` (+${registrationDataList.length - 1} more)` : ''}`
                        : null) ||
                    `${t.customer?.first_name || ''} ${t.customer?.last_name || ''}`.trim() ||
                    'Unknown';

                const customerEmail =
                    dbReg?.email ||
                    t.metadata?.registrationData?.email ||
                    registrationDataList?.[0]?.email ||
                    t.customer?.email ||
                    '';

                const bulkRegistrations = isBulk && registrationDataList
                    ? registrationDataList.map((r) => ({
                          fullName: r.fullName || 'Unknown',
                          email: r.email || '',
                          title: r.title || '',
                      }))
                    : null;

                return {
                    reference: t.reference,
                    amount: t.amount / 100,
                    currency: t.currency || 'NGN',
                    paystackStatus: t.status,
                    paidAt: t.paid_at || t.createdAt,
                    customerEmail,
                    fullName,
                    uniqueId: dbReg?.uniqueId || t.metadata?.uniqueId || null,
                    dbStatus: dbReg?.registrationStatus || null,
                    inDb: !!dbReg,
                    isBulk,
                    bulkCount: registrationDataList?.length || null,
                    bulkRegistrations,
                    gatewayResponse: t.gateway_response || null,
                    authorizationCode: t.authorization?.authorization_code || null,
                    paymentChannel: t.authorization?.channel || null,
                };
            });

        return NextResponse.json({
            success: true,
            data: result,
            total: totalCount,
            fetched: allTransactions.length,
            registrationCount: regTransactions.length,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Paystack Transactions] Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

interface PaystackPage {
    status: boolean;
    message?: string;
    data?: PaystackTransaction[];
    meta?: { total: number; skipped: number; perPage: number; page: number; pageCount: number };
}

interface PaystackTransaction {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paid_at: string;
    createdAt: string;
    gateway_response: string | null;
    authorization: {
        authorization_code: string | null;
        channel: string | null;
        card_type: string | null;
        bank: string | null;
    } | null;
    customer: {
        email: string;
        first_name: string | null;
        last_name: string | null;
    };
    metadata: {
        transaction_type?: string;
        uniqueId?: string;
        registrationData?: { fullName?: string; email?: string };
        registrationDataList?: Array<{ fullName?: string; email?: string; title?: string }>;
    };
}

interface DBRegistration {
    uniqueId: string;
    fullName: string;
    email: string;
    registrationStatus: string;
    paymentReference: string;
}

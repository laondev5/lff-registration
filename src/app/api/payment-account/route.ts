import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAccountByType } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
    try {
        const type = request.nextUrl.searchParams.get('type');

        if (!type || !['store', 'accommodation'].includes(type)) {
            return NextResponse.json(
                { error: "Query param 'type' must be 'store' or 'accommodation'" },
                { status: 400 }
            );
        }

        const account = await getPaymentAccountByType(type as 'store' | 'accommodation');

        if (!account) {
            return NextResponse.json({ account: null });
        }

        // Return only safe fields (no rowIndex)
        return NextResponse.json({
            account: {
                accountName: account.accountName,
                accountNumber: account.accountNumber,
                bankName: account.bankName,
                type: account.type,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

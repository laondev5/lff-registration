import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAccountByType } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
    try {
        const type = request.nextUrl.searchParams.get('type');

        if (!type || !['store', 'accommodation', 'registration'].includes(type)) {
            return NextResponse.json(
                { error: "Query param 'type' must be 'store', 'accommodation', or 'registration'" },
                { status: 400 }
            );
        }

        const account = await getPaymentAccountByType(type as 'store' | 'accommodation' | 'registration');

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

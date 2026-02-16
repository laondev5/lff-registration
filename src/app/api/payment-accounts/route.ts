import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAccountByType } from '@/lib/googleSheets';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') as 'store' | 'accommodation' | 'registration';

        if (!type) {
            return NextResponse.json({ success: false, error: 'Missing type parameter' }, { status: 400 });
        }

        const account = await getPaymentAccountByType(type);

        return NextResponse.json({ success: true, account });
    } catch (error: any) {
        console.error("Payment account fetch error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

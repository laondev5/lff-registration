import { NextResponse } from 'next/server';
import { getPaymentAccounts, addPaymentAccount } from '@/lib/googleSheets';

export async function GET() {
    try {
        const accounts = await getPaymentAccounts();
        return NextResponse.json(accounts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.accountName || !body.accountNumber || !body.bankName || !body.type) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: accountName, accountNumber, bankName, type" },
                { status: 400 }
            );
        }

        if (!['store', 'accommodation'].includes(body.type)) {
            return NextResponse.json(
                { success: false, error: "Type must be 'store' or 'accommodation'" },
                { status: 400 }
            );
        }

        const id = await addPaymentAccount(body);
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error("Payment account creation error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

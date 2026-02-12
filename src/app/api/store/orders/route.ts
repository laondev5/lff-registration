import { NextResponse } from 'next/server';
import { getOrders, createOrder, updateOrderStatus } from '@/lib/googleSheets';

export async function GET() {
    try {
        const orders = await getOrders();
        return NextResponse.json(orders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validation: Require items and total. 
        // User details are now flexible (either userId OR customer details)
        if (!body.items || !body.total) {
            return NextResponse.json({ success: false, error: "Missing required items or total" }, { status: 400 });
        }

        if (!body.userId && (!body.customerName || !body.customerEmail)) {
            return NextResponse.json({ success: false, error: "Missing customer details" }, { status: 400 });
        }

        const id = await createOrder(body);
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error("Order creation error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

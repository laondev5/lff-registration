import { NextResponse } from 'next/server';
import { getProducts, addProduct } from '@/lib/googleSheets';

export async function GET() {
    try {
        const products = await getProducts();
        return NextResponse.json({ success: true, products });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Basic validation
        if (!data.name || !data.price) {
            return NextResponse.json({ success: false, error: "Name and Price are required" }, { status: 400 });
        }

        const id = await addProduct(data);
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

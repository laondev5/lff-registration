import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/googleSheets';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();

        if (!data.status) {
            return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
        }

        await updateOrderStatus(id, data.status);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

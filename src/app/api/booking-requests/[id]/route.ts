import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();

        if (!data.status) {
            return NextResponse.json(
                { success: false, error: "Status is required" },
                { status: 400 }
            );
        }

        await connectDB();
        const booking = await Booking.findById(id);
        
        if (!booking) {
            return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
        }

        booking.status = data.status;
        await booking.save();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

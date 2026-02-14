import { NextResponse } from 'next/server';
import { getBookingRequests, createBookingRequest } from '@/lib/googleSheets';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function GET() {
    try {
        const bookings = await getBookingRequests();
        return NextResponse.json(bookings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const accommodationType = formData.get('accommodationType') as string;
        const accommodationId = formData.get('accommodationId') as string;
        const amount = formData.get('amount') as string;
        const uniqueId = formData.get('uniqueId') as string;
        const file = formData.get('file') as File | null;

        if (!name || !email || !phone || !accommodationType || !amount) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        let paymentProofUrl = '';
        if (file) {
            const uploadResult = await uploadToCloudinary(file, 'lff-booking-payments');
            paymentProofUrl = uploadResult.url;
        }

        const bookingId = await createBookingRequest({
            name,
            email,
            phone,
            accommodationType,
            accommodationId: accommodationId || '',
            amount,
            paymentProof: paymentProofUrl,
            uniqueId: uniqueId || '',
        });

        return NextResponse.json({ success: true, id: bookingId });
    } catch (error: any) {
        console.error("Booking request error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

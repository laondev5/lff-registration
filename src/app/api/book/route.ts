import { NextResponse } from 'next/server';
import { updateAccommodation } from '@/lib/googleSheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uniqueId, accommodation } = body;

        if (!uniqueId || !accommodation) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Check if we are in mock mode
        if (!process.env.GOOGLE_SHEET_ID) {
            console.warn("Google Sheet ID missing, mocking response");
            return NextResponse.json({
                success: true,
                message: "Mock Booking Successful"
            });
        }

        await updateAccommodation(uniqueId, accommodation);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Booking Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

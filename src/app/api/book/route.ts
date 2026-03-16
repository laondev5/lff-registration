import { NextResponse } from 'next/server';
import { updateAccommodation, getUserById } from '@/lib/registrationService';
import { sendAccommodationBookingEmail } from '@/lib/email';

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

        // Send accommodation confirmation email (non-blocking)
        getUserById(uniqueId).then((user) => {
            if (user) {
                sendAccommodationBookingEmail(
                    user.email,
                    user.fullName,
                    accommodation.type,
                    String(accommodation.price ?? '0'),
                    uniqueId
                ).catch((err) => console.error('Failed to send accommodation email:', err));
            }
        }).catch(() => {});

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Booking Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

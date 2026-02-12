import { NextResponse } from 'next/server';
import { appendRegistration } from '@/lib/googleSheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Check if we are in mock mode (no env vars)
        if (!process.env.GOOGLE_SHEET_ID) {
            console.warn("Google Sheet ID missing, mocking response");
            return NextResponse.json({
                success: true,
                uniqueId: `MOCK-${Date.now()}`,
                message: "Mock Registration Successful"
            });
        }

        const uniqueId = await appendRegistration(body);

        // Send Welcome Email (Fire and forget, don't block response)
        if (body.email && body.fullName) {
            import('@/lib/email').then(({ sendWelcomeEmail }) => {
                sendWelcomeEmail(body.email, body.fullName).catch(err => console.error("Email failed", err));
            });
        }

        return NextResponse.json({ success: true, uniqueId });
    } catch (error: any) {
        console.error("Registration Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

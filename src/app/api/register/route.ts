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

        return NextResponse.json({ success: true, uniqueId });
    } catch (error: any) {
        console.error("Registration Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

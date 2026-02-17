import { NextRequest, NextResponse } from 'next/server';
import { updateRegistrationStatus, getUserById } from '@/lib/googleSheets';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        // 1. Update status in Google Sheets
        await updateRegistrationStatus(id, 'Confirmed');

        // 2. Fetch user details to get email and name
        const user = await getUserById(id);
        
        if (!user) {
             return NextResponse.json({ error: "User not found after update" }, { status: 404 });
        }

        // 3. Send Welcome Email
        if (user.email && user.fullName) {
            await sendWelcomeEmail(user.email, user.fullName);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Confirmation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

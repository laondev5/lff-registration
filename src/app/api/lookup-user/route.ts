import { NextResponse } from 'next/server';
import { findUserByEmailOrPhone } from '@/lib/googleSheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { emailOrPhone } = body;

        if (!emailOrPhone) {
            return NextResponse.json(
                { success: false, error: "emailOrPhone is required" },
                { status: 400 }
            );
        }

        const user = await findUserByEmailOrPhone(emailOrPhone);

        if (user) {
            return NextResponse.json({
                found: true,
                user: {
                    uniqueId: user.uniqueId,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                }
            });
        }

        return NextResponse.json({ found: false });
    } catch (error: any) {
        console.error("User lookup error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

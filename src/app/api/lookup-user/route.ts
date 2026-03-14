import { NextResponse } from 'next/server';
import { findUserByIdOrEmail } from '@/lib/registrationService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { idOrEmail } = body;

        if (!idOrEmail) {
            return NextResponse.json(
                { success: false, error: "Registration ID or Email is required" },
                { status: 400 }
            );
        }

        const user = await findUserByIdOrEmail(idOrEmail);

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json(
                { success: false, error: "query parameter is required" },
                { status: 400 }
            );
        }

        const user = await findUserByIdOrEmail(query);

        if (user) {
            return NextResponse.json({
                success: true,
                user: {
                    uniqueId: user.uniqueId,
                    title: user.title,
                    fullName: user.fullName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    whatsapp: user.whatsapp,
                    gender: user.gender,
                    isLFFMember: user.isLFFMember,
                    churchDetails: user.churchDetails,
                    areaDistrict: user.areaDistrict,
                    state: user.state,
                    country: user.country,
                    attendanceType: user.attendanceType,
                    busInterest: user.busInterest,
                    mealCollection: user.mealCollection,
                    prayerRequest: user.prayerRequest,
                    registrationType: user.registrationType,
                    registrationAmount: user.registrationAmount,
                }
            });
        }

        return NextResponse.json({ success: false, error: "No registration found" });
    } catch (error: any) {
        console.error("User lookup GET error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

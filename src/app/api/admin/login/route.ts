import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin, logoutAdmin } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        const role = await loginAdmin(password);
        if (role) {
            return NextResponse.json({ success: true, role });
        } else {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    await logoutAdmin();
    return NextResponse.json({ success: true });
}

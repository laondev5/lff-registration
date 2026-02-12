
import { NextResponse } from 'next/server';
import { updateUserDepartment } from '@/lib/googleSheets';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { uniqueId, status, department, subDepartment } = body;

        if (!uniqueId || !status) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        await updateUserDepartment(uniqueId, { status, department, subDepartment });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

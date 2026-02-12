
import { NextResponse } from 'next/server';
import { getDepartments, addDepartment } from '@/lib/googleSheets';

export async function GET() {
    try {
        const departments = await getDepartments();
        return NextResponse.json({ success: true, departments });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, subDepartments } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const id = await addDepartment(name, subDepartments || []);
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

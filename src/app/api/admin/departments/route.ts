import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Department from '@/models/Department';

export async function GET() {
    try {
        await connectDB();
        const departments = await Department.find().sort({ createdAt: -1 }).lean();
        
        // Format response to match previous expected structure
        const formattedDepartments = departments.map((dept: any) => ({
            id: dept._id.toString(),
            _id: dept._id.toString(), // Some frontend code might expect _id
            name: dept.name,
            subDepartments: dept.subDepartments || []
        }));

        return NextResponse.json({ success: true, departments: formattedDepartments });
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

        await connectDB();
        const newDept = await Department.create({
            name,
            subDepartments: subDepartments || []
        });

        return NextResponse.json({ success: true, id: newDept._id.toString() });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

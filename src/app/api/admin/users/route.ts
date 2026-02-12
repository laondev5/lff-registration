import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/googleSheets';
import { isAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return unauthorizedResponse();
    }

    try {
        const users = await getUsers();
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

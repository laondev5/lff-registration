import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const COOKIE_NAME = 'admin_session';

export async function isAuthenticated() {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME);

    // In a real app, verify a signed token. 
    // Here we just check if the cookie exists and matches a simple hash or just existence if we trust the setter.
    // For simplicity, we'll store a simple value.
    return session?.value === 'authenticated';
}

export async function loginAdmin(password: string) {
    if (password === ADMIN_PASSWORD) {
        const cookieStore = await cookies();
        // Set cookie for 1 day
        cookieStore.set(COOKIE_NAME, 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/',
        });
        return true;
    }
    return false;
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SUBADMIN_PASSWORD = process.env.SUBADMIN_PASSWORD;
const COOKIE_NAME = 'admin_session';

export type AdminRole = 'admin' | 'subadmin' | null;

export async function getAdminRole(): Promise<AdminRole> {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME);
    const value = session?.value;
    if (value === 'admin') return 'admin';
    if (value === 'subadmin') return 'subadmin';
    // Backward compatibility: old sessions stored 'authenticated'
    if (value === 'authenticated') return 'admin';
    return null;
}

export async function isAuthenticated() {
    const role = await getAdminRole();
    return role !== null;
}

export async function isAdmin() {
    return (await getAdminRole()) === 'admin';
}

export async function isSubAdmin() {
    const role = await getAdminRole();
    return role === 'subadmin';
}

export async function loginAdmin(password: string): Promise<AdminRole> {
    if (password === ADMIN_PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, 'admin', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/',
        });
        return 'admin';
    }
    if (SUBADMIN_PASSWORD && password === SUBADMIN_PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, 'subadmin', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/',
        });
        return 'subadmin';
    }
    return null;
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

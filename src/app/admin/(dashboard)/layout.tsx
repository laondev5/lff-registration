import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/adminAuth';
import Link from 'next/link';
import { LayoutDashboard, Users, Home, LogOut, Package, ShoppingBag } from 'lucide-react';
import { logoutAdmin } from '@/lib/adminAuth';

// We need a client component for the logout button usually, but we can do a server action or just a route handler call.
// For simplicity, let's make a client component for the sidebar or just a form.

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isAuth = await isAuthenticated();

    if (!isAuth) {
        redirect('/admin/login');
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin/dashboard" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md">
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md">
                        <Users size={20} />
                        <span>Registrations</span>
                    </Link>
                    <Link href="/admin/accommodations" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md">
                        <Home size={20} />
                        <span>Accommodations</span>
                    </Link>
                    <div className="pt-2 pb-1 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Store Management
                    </div>
                    <Link href="/admin/store/products" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md">
                        <Package size={20} />
                        <span>Products</span>
                    </Link>
                    <Link href="/admin/store/orders" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md">
                        <ShoppingBag size={20} />
                        <span>Orders</span>
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <form action={async () => {
                        'use server';
                        await logoutAdmin();
                        redirect('/admin/login');
                    }}>
                        <button type="submit" className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-md">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Mobile Header (TODO if needed) */}
            
            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}

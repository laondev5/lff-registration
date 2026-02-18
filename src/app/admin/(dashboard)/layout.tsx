// Admin dashboard layout with sidebar

import { redirect } from "next/navigation";
import { isAuthenticated, logoutAdmin } from "@/lib/adminAuth";
import { AdminSidebar } from "@/components/admin/Sidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await isAuthenticated();

  if (!isAuth) {
    redirect("/admin/login");
  }

  // Server action wrapper for logout
  async function handleLogout() {
    "use server";
    await logoutAdmin();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-8 w-full">
        {children}
      </main>
    </div>
  );
}

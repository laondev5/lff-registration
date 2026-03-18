import { redirect } from "next/navigation";
import { isAuthenticated, logoutAdmin } from "@/lib/adminAuth";
import { SubAdminSidebar } from "@/components/admin/SubAdminSidebar";

export default async function SubAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await isAuthenticated();

  if (!isAuth) {
    redirect("/admin/login");
  }

  async function handleLogout() {
    "use server";
    await logoutAdmin();
    redirect("/admin/login");
  }

  return (
    <div className="bg-gray-50 flex flex-col md:flex-row md:h-screen md:overflow-hidden">
      <SubAdminSidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 w-full">
        {children}
      </main>
    </div>
  );
}

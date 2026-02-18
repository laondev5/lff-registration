"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Home,
  LogOut,
  Package,
  ShoppingBag,
  CreditCard,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminSidebar({ onLogout }: { onLogout: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = () => setIsOpen(false);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-gray-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white shadow-md flex-col transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:flex h-full`}
      >
        <div className="p-6 border-b flex items-center justify-between md:justify-start">
          <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
          {/* Close button inside sidebar (mobile only) */}
          <button
            onClick={closeSidebar}
            className="md:hidden p-1 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem
            href="/admin/dashboard"
            icon={LayoutDashboard}
            label="Overview"
            isActive={isActive("/admin/dashboard")}
            onClick={closeSidebar}
          />

          <NavItem
            href="/admin/users"
            icon={Users}
            label="Registrations"
            isActive={isActive("/admin/users")}
            onClick={closeSidebar}
          />

          <NavItem
            href="/admin/accommodations"
            icon={Home}
            label="Accommodations"
            isActive={isActive("/admin/accommodations")}
            onClick={closeSidebar}
          />

          <NavItem
            href="/admin/booking-requests"
            icon={ClipboardList}
            label="Booking Requests"
            isActive={isActive("/admin/booking-requests")}
            onClick={closeSidebar}
          />

          <div className="pt-2 pb-1 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Store Management
          </div>

          <NavItem
            href="/admin/store/products"
            icon={Package}
            label="Products"
            isActive={isActive("/admin/store/products")}
            onClick={closeSidebar}
          />

          <NavItem
            href="/admin/store/orders"
            icon={ShoppingBag}
            label="Orders"
            isActive={isActive("/admin/store/orders")}
            onClick={closeSidebar}
          />

          <div className="pt-2 pb-1 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Settings
          </div>

          <NavItem
            href="/admin/payment-accounts"
            icon={CreditCard}
            label="Payment Accounts"
            isActive={isActive("/admin/payment-accounts")}
            onClick={closeSidebar}
          />
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => {
              onLogout();
              closeSidebar();
            }}
            className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  href: string;
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon size={20} className={isActive ? "text-primary" : "text-gray-500"} />
      <span>{label}</span>
    </Link>
  );
}

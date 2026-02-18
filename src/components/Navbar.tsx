"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Users } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="border-b border-white/10 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-white flex items-center gap-2"
        >
          <img
            src="/logo.png"
            alt="LFF GAC 2026"
            className="w-24 h-24 p-4 rounded-lg object-contain"
          />
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/bulk-registration"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            Bulk Register
          </Link>

          <Link
            href="/accommodations"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Accommodations
          </Link>

          {pathname?.startsWith("/store") && (
            <Link
              href="/store/cart"
              className="relative text-gray-300 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

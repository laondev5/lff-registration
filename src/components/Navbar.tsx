"use client";

import Link from "next/link";
import { ShoppingCart, Users } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react";

export function Navbar() {
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
          <span className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center">
            L
          </span>
          GAC 2026
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
        </div>
      </div>
    </nav>
  );
}

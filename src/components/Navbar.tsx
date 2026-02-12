"use client";

import Link from 'next/link';
import { ShoppingCart, LogIn } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useEffect, useState } from 'react';

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
                <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center">L</span>
                    GAC 2026
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/store" className="text-gray-300 hover:text-white transition-colors">
                        Store
                    </Link>
                    
                    <Link href="/store/cart" className="relative text-gray-300 hover:text-white transition-colors">
                        <ShoppingCart className="w-6 h-6" />
                        {mounted && itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                                {itemCount}
                            </span>
                        )}
                    </Link>

                    {/* <Link href="/admin/login" className="text-gray-500 hover:text-white transition-colors" title="Admin Login">
                        <LogIn className="w-5 h-5" />
                    </Link> */}
                </div>
            </div>
        </nav>
    );
}

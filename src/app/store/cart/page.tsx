"use client";

import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { Trash2, ChevronRight, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { items, removeItem, updateQuantity, getTotal } = useCartStore();
    const router = useRouter();

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-gray-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h1>
                <p className="text-gray-400 mb-8">Looks like you haven't added anything yet.</p>
                <Link href="/store" className="btn-primary">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <div key={item.product.id} className="bg-card border border-white/10 rounded-xl p-4 flex gap-4 items-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.product.images[0] && (
                                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="font-bold text-white truncate">{item.product.name}</h3>
                                    <div className="text-primary font-semibold">₦{parseInt(item.product.price).toLocaleString()}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <select
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-primary"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                            <option key={num} value={num} className="text-black">{num}</option>
                                        ))}
                                    </select>
                                    
                                    <button
                                        onClick={() => removeItem(item.product.id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors p-2"
                                        title="Remove"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-card border border-white/10 rounded-xl p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>₦{getTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Shipping</span>
                                    <span className="text-xs">(Calculated at next step)</span>
                                </div>
                                <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-xl">
                                    <span>Total</span>
                                    <span>₦{getTotal().toLocaleString()}</span>
                                </div>
                            </div>

                            <Link href="/store/checkout" className="w-full btn-primary py-3 flex items-center justify-center font-bold">
                                Checkout <ChevronRight className="w-4 h-4 ml-2" />
                            </Link>
                            
                            <div className="mt-4 text-center">
                                <Link href="/store" className="text-sm text-gray-500 hover:text-white">
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

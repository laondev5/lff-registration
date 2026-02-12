"use client";

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore, Product } from '@/store/useCartStore';
import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
    const addItem = useCartStore((state) => state.addItem);
    const [added, setAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <Link href={`/store/product/${product.id}`} className="group bg-card border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col">
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {product.images[0] ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                        No Image
                    </div>
                )}
                
                <button
                    onClick={handleAddToCart}
                    className="absolute bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/90"
                    title="Add to Cart"
                >
                    <ShoppingCart size={20} />
                </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider">{product.category}</div>
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                    <span className="text-xl font-bold text-white">₦{parseInt(product.price).toLocaleString()}</span>
                    {added && <span className="text-xs text-green-400 font-medium animate-pulse">Added!</span>}
                </div>
            </div>
        </Link>
    );
}

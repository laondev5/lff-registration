"use client";

import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Product } from '@/store/useCartStore';

export function ProductCard({ product }: { product: Product }) {
    const totalStock = product.variants && product.variants.length > 0
        ? product.variants.reduce((sum, v) => sum + v.stock, 0)
        : parseInt(product.stock) || 0;

    const stockStatus = totalStock === 0 ? 'out' : totalStock <= 5 ? 'low' : 'in';

    const isNew = product.createdAt
        ? (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
        : false;

    const sizeRange = product.sizes && product.sizes.length > 0
        ? product.sizes.length === 1 ? product.sizes[0] : `${product.sizes[0]} - ${product.sizes[product.sizes.length - 1]}`
        : null;

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

                {/* Quick View overlay */}
                <div className="product-card-overlay">
                    <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        <Eye size={16} /> Quick View
                    </span>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isNew && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                            NEW
                        </span>
                    )}
                    {stockStatus === 'out' && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            Sold Out
                        </span>
                    )}
                    {stockStatus === 'low' && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            Low Stock
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider">{product.category}</div>
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>

                {/* Size range */}
                {sizeRange && (
                    <p className="text-xs text-gray-500 mb-2">Sizes: {sizeRange}</p>
                )}

                <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-white">₦{parseInt(product.price).toLocaleString()}</span>
                        {stockStatus === 'in' && (
                            <span className="text-xs text-green-400">In Stock</span>
                        )}
                    </div>

                    {/* Color swatches */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            {product.colors.slice(0, 5).map((color, idx) => (
                                <div
                                    key={idx}
                                    className="color-swatch-sm"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            ))}
                            {product.colors.length > 5 && (
                                <span className="text-xs text-gray-500 ml-1">+{product.colors.length - 5}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

"use client";

import { useState } from 'react';
import { ShoppingCart, Check, ChevronLeft } from 'lucide-react';
import { useCartStore, Product } from '@/store/useCartStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function ProductDetails({ product }: { product: Product }) {
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);
    const [mainImage, setMainImage] = useState(product.images[0] || null);
    const [added, setAdded] = useState(false);

    const handleAddToCart = () => {
        addItem(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
                <div className="aspect-square bg-card border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative">
                    {mainImage ? (
                        <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-gray-500">No Image Available</div>
                    )}
                </div>
                
                {product.images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {product.images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setMainImage(img)}
                                className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                                    mainImage === img ? 'border-primary' : 'border-transparent hover:border-white/20'
                                }`}
                            >
                                <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
                <Link href="/store" className="text-sm text-gray-500 hover:text-white mb-6 inline-flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Store
                </Link>

                <div className="text-primary font-bold uppercase tracking-wider text-sm mb-2">{product.category}</div>
                <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
                <div className="text-3xl font-bold text-white mb-8">₦{parseInt(product.price).toLocaleString()}</div>

                <div className="prose prose-invert max-w-none mb-8 text-gray-400">
                    <p>{product.description}</p>
                </div>

                <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleAddToCart}
                            className={`flex-1 btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 transition-all ${
                                added ? 'bg-green-600 hover:bg-green-700' : ''
                            }`}
                        >
                            {added ? (
                                <>
                                    <Check className="w-5 h-5" /> Added to Cart
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                                </>
                            )}
                        </button>
                    </div>
                    {added && (
                        <div className="text-center">
                            <Link href="/store/cart" className="text-sm text-primary hover:underline">
                                View Cart & Checkout
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

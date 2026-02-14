"use client";

import { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Product } from '@/store/useCartStore';

export function ProductGrid({ products }: { products: Product[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
    const [showFilters, setShowFilters] = useState(false);

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

    const maxPrice = useMemo(() => {
        if (products.length === 0) return 100000;
        return Math.max(...products.map(p => parseInt(p.price) || 0));
    }, [products]);

    const effectiveRange: [number, number] = priceRange[1] === 0 ? [0, maxPrice] : priceRange;

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const price = parseInt(product.price) || 0;
        const matchesPrice = price >= effectiveRange[0] && price <= effectiveRange[1];
        return matchesSearch && matchesCategory && matchesPrice;
    });

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="bg-card/50 p-4 rounded-xl border border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex gap-2 overflow-x-auto flex-1 md:flex-initial pb-2 md:pb-0 scrollbar-hide">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                        selectedCategory === category
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2.5 rounded-lg border transition-colors ${showFilters ? 'border-primary text-primary' : 'border-white/10 text-gray-400 hover:text-white'}`}
                        >
                            <SlidersHorizontal size={18} />
                        </button>
                    </div>
                </div>

                {/* Price Range Filter */}
                {showFilters && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center pt-2 border-t border-white/5 animate-slide-up">
                        <span className="text-sm text-gray-400">Price Range:</span>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange[0] || ''}
                                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                className="w-28 bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange[1] || ''}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                                className="w-28 bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                            />
                            {(priceRange[0] > 0 || priceRange[1] > 0) && (
                                <button
                                    onClick={() => setPriceRange([0, 0])}
                                    className="text-xs text-gray-500 hover:text-white"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </div>

            {/* Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">No products found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}

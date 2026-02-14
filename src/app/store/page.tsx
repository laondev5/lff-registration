import { getProducts } from '@/lib/storeService';
import { ProductGrid } from '@/components/store/ProductGrid';
import { ShoppingBag, Sparkles, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-background text-foreground">
            {/* Hero Banner */}
            <section className="hero-gradient py-16 md:py-24 px-4 border-b border-white/5">
                <div className="container mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                        <Sparkles size={14} />
                        Official Conference Merch
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                        GAC 2026 Store
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                        Get your official conference merchandise, books, and accessories. Shop now and show your spirit!
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <ShoppingBag size={16} className="text-primary" />
                            <span>{products.length} Products</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Truck size={16} className="text-primary" />
                            <span>Event Pickup Available</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products */}
            <section className="py-12 px-4">
                <div className="container mx-auto">
                    <ProductGrid products={products} />
                </div>
            </section>
        </main>
    );
}

import { getProducts } from '@/lib/googleSheets';
import { ProductGrid } from '@/components/store/ProductGrid';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-background text-foreground py-12 px-4">
            <div className="container mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">GAC 2026 Store</h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Get your official conference merchandise, books, and accessories.
                    </p>
                </div>
                
                <ProductGrid products={products} />
            </div>
        </main>
    );
}

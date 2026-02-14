import { getProduct } from '@/lib/storeService';
import { ProductDetails } from '@/components/store/ProductDetails';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background text-foreground py-12 px-4">
            <div className="container mx-auto max-w-6xl">
                <ProductDetails product={product} />
            </div>
        </main>
    );
}

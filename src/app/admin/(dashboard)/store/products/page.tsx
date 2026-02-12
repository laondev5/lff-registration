import { getProducts } from '@/lib/googleSheets';
import { ProductList } from '@/components/admin/ProductList';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="container mx-auto">
            <ProductList initialProducts={products} />
        </div>
    );
}

import { ProductForm } from '@/components/admin/ProductForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function NewProductPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/store/products" className="text-gray-500 hover:text-gray-900 flex items-center mb-2">
                    <ChevronLeft size={16} className="mr-1" /> Back to Products
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
            </div>
            
            <ProductForm />
        </div>
    );
}

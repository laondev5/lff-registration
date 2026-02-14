"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Plus, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductVariant {
    color: string;
    size: string;
    stock: number;
    sku: string;
}

interface Product {
    id: string;
    name: string;
    price: string;
    category: string;
    stock: string;
    images: string[];
    variants?: ProductVariant[];
    colors?: { name: string; hex: string }[];
    sizes?: string[];
}

export function ProductList({ initialProducts }: { initialProducts: Product[] }) {
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/store/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id));
                router.refresh();
            } else {
                alert("Failed to delete product");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting product");
        } finally {
            setDeletingId(null);
        }
    };

    const getTotalStock = (product: Product) => {
        if (product.variants && product.variants.length > 0) {
            return product.variants.reduce((sum, v) => sum + v.stock, 0);
        }
        return parseInt(product.stock) || 0;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="w-6 h-6" /> Products
                </h2>
                <Link href="/admin/store/products/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={16} /> Add Product
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    No products found.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
                                            {product.images[0] && (
                                                <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₦{product.price}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTotalStock(product)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {product.variants && product.variants.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {product.variants.length} variants
                                                </span>
                                                {product.colors && product.colors.length > 0 && (
                                                    <div className="flex -space-x-1">
                                                        {product.colors.slice(0, 4).map((c, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-4 h-4 rounded-full border border-white"
                                                                style={{ backgroundColor: c.hex }}
                                                                title={c.name}
                                                            />
                                                        ))}
                                                        {product.colors.length > 4 && (
                                                            <span className="text-xs text-gray-400 ml-1">+{product.colors.length - 4}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">No variants</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/admin/store/products/${product.id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded">
                                                <Edit size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                disabled={deletingId === product.id}
                                                className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded disabled:opacity-50"
                                            >
                                                {deletingId === product.id ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Plus, Package, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 20;

export function ProductList({ initialProducts }: { initialProducts: Product[] }) {
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

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

    const stats = useMemo(() => {
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + getTotalStock(p), 0);
        const lowStock = products.filter(p => {
            const s = getTotalStock(p);
            return s < 5 && s > 0;
        }).length;
        const outOfStock = products.filter(p => getTotalStock(p) === 0).length;
        return { totalProducts, totalStock, lowStock, outOfStock };
    }, [products]);

    const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return products.slice(start, start + ITEMS_PER_PAGE);
    }, [products, currentPage]);

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

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow border p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Products</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalProducts}</p>
                </div>
                <div className="bg-white rounded-lg shadow border p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Stock</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalStock}</p>
                </div>
                <div className="bg-white rounded-lg shadow border p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Low Stock</p>
                    <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.lowStock}</p>
                </div>
                <div className="bg-white rounded-lg shadow border p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
                </div>
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
                        {paginatedProducts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    No products found.
                                </td>
                            </tr>
                        ) : (
                            paginatedProducts.map((product) => (
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{" "}
                                    <span className="font-medium">
                                        {products.length === 0 ? 0 : Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, products.length)}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-medium">
                                        {Math.min(currentPage * ITEMS_PER_PAGE, products.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{products.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav
                                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                    aria-label="Pagination"
                                >
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(
                                            (page) =>
                                                page === 1 ||
                                                page === totalPages ||
                                                Math.abs(currentPage - page) <= 1,
                                        )
                                        .map((page, index, array) => (
                                            <span key={page} className="flex">
                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                        ...
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        currentPage === page
                                                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </span>
                                        ))}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

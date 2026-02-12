"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

interface CartItem {
    product: {
        id: string;
        name: string;
        price: string;
    };
    quantity: number;
}

interface Order {
    id: string;
    userId: string;
    items: CartItem[];
    total: string;
    status: string;
    createdAt: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}

export function OrderList({ initialOrders }: { initialOrders: Order[] }) {
    const router = useRouter();
    const [orders, setOrders] = useState(initialOrders);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/store/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
                router.refresh();
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating status");
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    const statusColors: Record<string, string> = {
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Paid': 'bg-blue-100 text-blue-800',
        'Shipped': 'bg-purple-100 text-purple-800',
        'Delivered': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-red-100 text-red-800',
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-6 h-6" /> Orders
            </h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <>
                                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                                            {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            {order.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.userId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{order.customerName || order.userId}</span>
                                                {order.customerEmail && <span className="text-xs text-gray-400">{order.customerEmail}</span>}
                                                {order.customerPhone && <span className="text-xs text-gray-400">{order.customerPhone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">₦{order.total}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                disabled={updatingId === order.id}
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                className="border-gray-300 rounded-md shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 p-1 bg-white text-gray-700 font-medium border"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                    {expandedOrder === order.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={6} className="px-6 py-4">
                                                <div className="text-sm text-gray-700">
                                                    <h4 className="font-bold mb-2">Order Items:</h4>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {order.items.map((item, idx) => (
                                                            <li key={idx}>
                                                                {item.quantity}x {item.product.name} - ₦{item.product.price} (Total: ₦{parseInt(item.product.price) * item.quantity})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

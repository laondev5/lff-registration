"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

interface CartItem {
  product?: {
    id: string;
    name: string;
    price: string;
  };
  productId?: string;
  name?: string;
  price?: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
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
  paymentProof?: string;
  itemsSummary?: string;
}

export function OrderList({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/store/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
        );
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
    Pending: "bg-yellow-100 text-yellow-800",
    Paid: "bg-blue-100 text-blue-800",
    Shipped: "bg-purple-100 text-purple-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Package className="w-6 h-6" /> Orders
      </h2>

      {/* Payment Proof Modal */}
      {proofModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setProofModal(null)}
        >
          <div
            className="max-w-2xl max-h-[90vh] bg-white rounded-xl p-2 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={proofModal}
              alt="Payment Proof"
              className="w-full rounded-lg"
            />
            <div className="p-3 text-center">
              <a
                href={proofModal}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
              >
                <ExternalLink size={14} /> Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proof
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tbody key={order.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                      {expandedOrder === order.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {order.customerName || order.userId}
                        </span>
                        {order.customerEmail && (
                          <span className="text-xs text-gray-400">
                            {order.customerEmail}
                          </span>
                        )}
                        {order.customerPhone && (
                          <span className="text-xs text-gray-400">
                            {order.customerPhone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      ₦{order.total}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.paymentProof ? (
                        <button
                          onClick={() => setProofModal(order.paymentProof!)}
                          className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full hover:bg-green-100 transition-colors"
                        >
                          <ImageIcon size={12} /> View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        disabled={updatingId === order.id}
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value)
                        }
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
                      <td colSpan={7} className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          <h4 className="font-bold mb-2">Order Items:</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => {
                              const itemName =
                                item.product?.name || item.name || "Unknown";
                              const itemPrice =
                                item.product?.price || item.price || "0";
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200"
                                >
                                  <div className="flex-1">
                                    <span className="font-medium">
                                      {item.quantity}x {itemName}
                                    </span>
                                    {(item.selectedColor ||
                                      item.selectedSize) && (
                                      <div className="flex items-center gap-2 mt-1">
                                        {item.selectedColor && (
                                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                            Color: {item.selectedColor}
                                          </span>
                                        )}
                                        {item.selectedSize && (
                                          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                            Size: {item.selectedSize}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-gray-500">
                                    ₦{parseInt(itemPrice).toLocaleString()} each
                                  </span>
                                  <span className="font-bold">
                                    ₦
                                    {(
                                      parseInt(itemPrice) * item.quantity
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {order.paymentProof && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm font-medium text-green-800 mb-2">
                                Payment Proof:
                              </p>
                              <a
                                href={order.paymentProof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                              >
                                <ExternalLink size={14} /> View Payment Proof
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

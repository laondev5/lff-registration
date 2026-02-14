"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ExternalLink, Image as ImageIcon } from "lucide-react";

interface BookingRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  accommodationType: string;
  accommodationId: string;
  amount: string;
  paymentProof: string;
  status: string;
  createdAt: string;
  uniqueId: string;
}

export default function BookingRequestsClient({
  initialBookings,
}: {
  initialBookings: BookingRequest[];
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/booking-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)),
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

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-800",
    Confirmed: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <ClipboardList className="w-6 h-6" /> Booking Requests
      </h2>

      {/* Proof Modal */}
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

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Accommodation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Proof
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No booking requests yet.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {booking.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.name}
                    </div>
                    <div className="text-xs text-gray-500">{booking.email}</div>
                    <div className="text-xs text-gray-500">{booking.phone}</div>
                    {booking.uniqueId && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        Registered: {booking.uniqueId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {booking.accommodationType}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">
                    ₦{parseInt(booking.amount || "0").toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {booking.paymentProof ? (
                      <button
                        onClick={() => setProofModal(booking.paymentProof)}
                        className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full hover:bg-green-100 transition-colors"
                      >
                        <ImageIcon size={12} /> View Proof
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No proof</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      disabled={updatingId === booking.id}
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusUpdate(booking.id, e.target.value)
                      }
                      className="border-gray-300 rounded-md shadow-sm text-sm p-1 bg-white text-gray-700 font-medium border focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
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

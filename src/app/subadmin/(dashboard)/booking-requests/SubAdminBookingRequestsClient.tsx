"use client";

import { useState, useMemo, useEffect } from "react";
import { ClipboardList, ExternalLink, Image as ImageIcon, Search, ChevronLeft, ChevronRight } from "lucide-react";

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
  isRegistration?: boolean;
}

const ITEMS_PER_PAGE = 20;

export default function SubAdminBookingRequestsClient({
  initialBookings,
}: {
  initialBookings: BookingRequest[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [proofModal, setProofModal] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: initialBookings.length,
    confirmed: initialBookings.filter((b) => b.status === "Confirmed").length,
    pending: initialBookings.filter((b) => b.status === "Pending").length,
    rejected: initialBookings.filter((b) => b.status === "Rejected").length,
  }), [initialBookings]);

  const filteredBookings = useMemo(() => initialBookings.filter((booking) => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      booking.name?.toLowerCase().includes(searchString) ||
      booking.email?.toLowerCase().includes(searchString) ||
      booking.phone?.includes(searchTerm) ||
      booking.uniqueId?.toLowerCase().includes(searchString) ||
      booking.accommodationType?.toLowerCase().includes(searchString);

    const matchesStatus =
      statusFilter === "All" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  }), [initialBookings, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Bookings</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
        </div>
      </div>

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
            <img src={proofModal} alt="Payment Proof" className="w-full rounded-lg" />
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

      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accommodation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proof</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No booking requests found.
                </td>
              </tr>
            ) : (
              paginatedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                    <div className="text-xs text-gray-500">{booking.email}</div>
                    <div className="text-xs text-gray-500">{booking.phone}</div>
                    {booking.uniqueId && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {booking.uniqueId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{booking.accommodationType}</td>
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[booking.status] || "bg-gray-100 text-gray-800"}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow border">
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
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{filteredBookings.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
              {" "}to{" "}
              <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}</span>
              {" "}of <span className="font-medium">{filteredBookings.length}</span> results
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1)
                .map((page, index, array) => (
                  <span key={page} className="flex">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
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
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

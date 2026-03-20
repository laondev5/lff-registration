"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  RotateCcw,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Mail,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface TrashedUser {
  uniqueId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  registrationStatus: string;
  needsAccommodation: string;
  accommodationType: string;
  trashedAt: string;
  trashedFrom: string;
  reRegisterEmailSent: boolean;
  createdAt: string;
  paymentReference?: string;
}

const ITEMS_PER_PAGE = 20;

export default function TrashClient() {
  const [records, setRecords] = useState<TrashedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/trash");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setRecords(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !searchTerm ||
        r.fullName.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.uniqueId.toLowerCase().includes(s) ||
        r.phoneNumber?.includes(searchTerm);

      const matchSource =
        sourceFilter === "All" || r.trashedFrom === sourceFilter;

      return matchSearch && matchSource;
    });
  }, [records, searchTerm, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sourceFilter]);

  const handleRestore = async (uniqueId: string, fullName: string) => {
    if (!window.confirm(`Restore "${fullName}" back to the active registrations list?`)) return;
    setRestoringId(uniqueId);
    try {
      const res = await fetch(`/api/admin/trash/${uniqueId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setRecords((prev) => prev.filter((r) => r.uniqueId !== uniqueId));
      } else {
        toast.error(data.error || "Failed to restore.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (uniqueId: string, fullName: string) => {
    if (
      !window.confirm(
        `Permanently delete "${fullName}"?\n\nThis cannot be undone. The record will be removed forever.`
      )
    )
      return;
    setDeletingId(uniqueId);
    try {
      const res = await fetch(`/api/admin/trash/${uniqueId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setRecords((prev) => prev.filter((r) => r.uniqueId !== uniqueId));
      } else {
        toast.error(data.error || "Failed to delete.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <span className="ml-3 text-gray-600">Loading trash…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" /> Trash
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Deleted registrations — not counted in stats or accommodation slots.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total in Trash</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{records.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">From Registrations</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">
            {records.filter((r) => r.trashedFrom === "users").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">From Paystack Payments</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">
            {records.filter((r) => r.trashedFrom === "paystack-payments").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, email, or ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
        >
          <option value="All">All Sources</option>
          <option value="users">Registrations Page</option>
          <option value="paystack-payments">Paystack Payments Page</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deleted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email Sent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Trash2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Trash is empty.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.uniqueId} className="hover:bg-gray-50">
                    {/* Name / ID */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{r.fullName}</div>
                      <div className="text-xs text-blue-600">{r.uniqueId}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                        r.registrationStatus === "Confirmed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.registrationStatus}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800">{r.email}</div>
                      <div className="text-xs text-gray-500">{r.phoneNumber}</div>
                    </td>

                    {/* Registration info */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">
                        Registered:{" "}
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                      {r.needsAccommodation && r.needsAccommodation !== "No" && (
                        <div className="text-xs text-purple-600 mt-0.5">
                          Accommodation: {r.accommodationType || "Yes"}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5 capitalize">
                        Source: {r.trashedFrom === "users" ? "Registrations" : "Paystack Payments"}
                      </div>
                    </td>

                    {/* Deleted at */}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {r.trashedAt
                        ? new Date(r.trashedAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                      <div className="text-xs text-gray-400">
                        {r.trashedAt
                          ? new Date(r.trashedAt).toLocaleTimeString("en-NG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </td>

                    {/* Re-register email sent */}
                    <td className="px-4 py-3">
                      {r.reRegisterEmailSent ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Mail className="w-3.5 h-3.5" /> Not sent
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleRestore(r.uniqueId, r.fullName)}
                          disabled={restoringId === r.uniqueId || !!deletingId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {restoringId === r.uniqueId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(r.uniqueId, r.fullName)}
                          disabled={deletingId === r.uniqueId || !!restoringId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {deletingId === r.uniqueId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Delete Forever
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>
              {" "}–{" "}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>
              {" "}of <span className="font-medium">{filtered.length}</span>
            </p>
            <nav className="inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm text-gray-700">…</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === p
                          ? "z-10 bg-red-50 border-red-400 text-red-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface PaystackEntry {
  reference: string;
  amount: number;
  currency: string;
  paystackStatus: string;
  paidAt: string;
  customerEmail: string;
  fullName: string;
  uniqueId: string | null;
  dbStatus: string | null;
  inDb: boolean;
  isBulk: boolean;
  bulkCount: number | null;
}

const ITEMS_PER_PAGE = 20;

export default function PaystackPaymentsClient() {
  const router = useRouter();
  const [entries, setEntries] = useState<PaystackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/paystack-transactions");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load");
      setEntries(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => ({
    total: entries.length,
    successPaystack: entries.filter((e) => e.paystackStatus === "success").length,
    confirmedDb: entries.filter((e) => e.dbStatus === "Confirmed").length,
    pendingDb: entries.filter(
      (e) => e.paystackStatus === "success" && e.dbStatus !== "Confirmed"
    ).length,
  }), [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const s = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        e.fullName.toLowerCase().includes(s) ||
        e.customerEmail.toLowerCase().includes(s) ||
        e.reference.toLowerCase().includes(s) ||
        (e.uniqueId || "").toLowerCase().includes(s);

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Confirmed" && e.dbStatus === "Confirmed") ||
        (statusFilter === "Pending" && e.paystackStatus === "success" && e.dbStatus !== "Confirmed") ||
        (statusFilter === "Not in DB" && !e.inDb) ||
        (statusFilter === "Failed" && e.paystackStatus !== "success");

      return matchSearch && matchStatus;
    });
  }, [entries, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleConfirm = async (uniqueId: string, name: string) => {
    if (!window.confirm(`Confirm registration for "${name}"? A confirmation email will be sent.`)) return;
    setConfirmingId(uniqueId);
    try {
      const res = await fetch(`/api/admin/users/${uniqueId}`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} confirmed. Email sent.`);
        router.refresh();
        // Update local state
        setEntries((prev) =>
          prev.map((e) =>
            e.uniqueId === uniqueId ? { ...e, dbStatus: "Confirmed" } : e
          )
        );
      } else {
        toast.error(data.error || "Failed to confirm.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setConfirmingId(null);
    }
  };

  const getDisplayStatus = (e: PaystackEntry) => {
    if (e.dbStatus === "Confirmed") return { label: "Confirmed", cls: "bg-green-100 text-green-800" };
    if (e.paystackStatus === "success" && !e.inDb) return { label: "Not in DB", cls: "bg-orange-100 text-orange-800" };
    if (e.paystackStatus === "success" && e.dbStatus === "Pending") return { label: "Pending", cls: "bg-yellow-100 text-yellow-800" };
    if (e.paystackStatus === "success" && !e.dbStatus) return { label: "Pending", cls: "bg-yellow-100 text-yellow-800" };
    if (e.paystackStatus === "failed") return { label: "Failed", cls: "bg-red-100 text-red-800" };
    return { label: e.paystackStatus, cls: "bg-gray-100 text-gray-800" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading Paystack transactions…</span>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Banknote className="w-6 h-6" /> Paystack Payments
        </h1>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmedDb}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Pending Confirmation</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.pendingDb}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Successful (Paystack)</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.successPaystack}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, email, reference, or ID…"
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
          <option value="All">All</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending Confirmation</option>
          <option value="Not in DB">Not in DB</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginated.map((e) => {
                  const { label, cls } = getDisplayStatus(e);
                  return (
                    <tr key={e.reference} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{e.fullName}</div>
                        <div className="text-xs text-gray-500">{e.customerEmail}</div>
                        {e.uniqueId && (
                          <div className="text-xs text-blue-600">{e.uniqueId}</div>
                        )}
                        {e.isBulk && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            Bulk × {e.bulkCount}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-mono">{e.reference}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                        ₦{e.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {e.paidAt ? new Date(e.paidAt).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}>
                          {label}
                        </span>
                        {!e.inDb && e.paystackStatus === "success" && (
                          <div className="text-xs text-orange-600 mt-1">Not saved in DB</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {e.paystackStatus === "success" && e.dbStatus !== "Confirmed" && e.uniqueId ? (
                          <button
                            onClick={() => handleConfirm(e.uniqueId!, e.fullName)}
                            disabled={confirmingId === e.uniqueId}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {confirmingId === e.uniqueId ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3 h-3 mr-1" />
                            )}
                            Confirm
                          </button>
                        ) : e.dbStatus === "Confirmed" ? (
                          <span className="inline-flex items-center text-xs text-green-700 gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </span>
                        ) : e.paystackStatus === "success" && !e.inDb ? (
                          <span className="text-xs text-orange-600">Use Recover on Registration page</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="hidden sm:flex items-center gap-4">
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                {" "}–{" "}
                <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span>
                {" "}of <span className="font-medium">{filtered.length}</span>
              </p>
            </div>
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
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
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

"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  Trash2,
  Mail,
  Calendar,
  Users,
  CreditCard,
  UserPlus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

interface BulkRegistrant {
  fullName: string;
  email: string;
  title?: string;
}

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
  bulkRegistrations: BulkRegistrant[] | null;
  gatewayResponse: string | null;
  authorizationCode: string | null;
  paymentChannel: string | null;
}

const ITEMS_PER_PAGE = 20;

export default function PaystackPaymentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);
  const [entries, setEntries] = useState<PaystackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
  const [dismissingRefs, setDismissingRefs] = useState<Set<string>>(new Set());
  const [sendingEmailRefs, setSendingEmailRefs] = useState<Set<string>>(new Set());
  const [makingPaymentRefs, setMakingPaymentRefs] = useState<Set<string>>(new Set());
  const [addingToDbRefs, setAddingToDbRefs] = useState<Set<string>>(new Set());
  const [dismissedRefs, setDismissedRefs] = useState<Set<string>>(new Set());
  const [bulkActioning, setBulkActioning] = useState(false);
  const [bulkAddingToDb, setBulkAddingToDb] = useState(false);
  const [bulkConfirmingPending, setBulkConfirmingPending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/paystack-transactions");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load");
      setEntries(json.data);
      setDismissedRefs(new Set()); // reset on refresh
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show toast when returning from Paystack admin payment and clean URL
  useEffect(() => {
    if (toastShown.current) return;
    const status = searchParams.get("status");
    const isBulk = searchParams.get("bulk") === "true";
    const count = searchParams.get("count");
    if (status === "success") {
      toastShown.current = true;
      const msg = isBulk
        ? `Payment successful! ${count} registration(s) have been confirmed.`
        : "Payment successful! Registration has been confirmed.";
      toast.success(msg, { duration: 5000 });
      router.replace("/admin/paystack-payments");
    } else if (status === "error") {
      toastShown.current = true;
      const message = searchParams.get("message") || "Payment failed.";
      toast.error(`Payment failed: ${message}`);
      router.replace("/admin/paystack-payments");
    }
  }, [searchParams, router]);

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
      if (dismissedRefs.has(e.reference)) return false;

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
        (statusFilter === "Not in DB" && !e.inDb && e.paystackStatus === "success") ||
        (statusFilter === "Failed" && e.paystackStatus === "failed") ||
        (statusFilter === "Abandoned" && e.paystackStatus === "abandoned");

      let matchDate = true;
      if (dateFrom || dateTo) {
        const entryDate = e.paidAt ? new Date(e.paidAt) : null;
        if (!entryDate) {
          matchDate = false;
        } else {
          if (dateFrom) matchDate = matchDate && entryDate >= new Date(dateFrom);
          if (dateTo) matchDate = matchDate && entryDate <= new Date(dateTo + "T23:59:59");
        }
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [entries, searchTerm, statusFilter, dateFrom, dateTo, dismissedRefs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const allPageSelected =
    paginated.length > 0 && paginated.every((e) => selectedRefs.has(e.reference));
  const somePageSelected = paginated.some((e) => selectedRefs.has(e.reference));

  const handleSelectAll = (checked: boolean) => {
    setSelectedRefs((prev) => {
      const next = new Set(prev);
      paginated.forEach((e) => {
        if (checked) next.add(e.reference);
        else next.delete(e.reference);
      });
      return next;
    });
  };

  const handleSelectOne = (reference: string, checked: boolean) => {
    setSelectedRefs((prev) => {
      const next = new Set(prev);
      if (checked) next.add(reference);
      else next.delete(reference);
      return next;
    });
  };

  const handleConfirm = async (uniqueId: string, name: string) => {
    if (!window.confirm(`Confirm registration for "${name}"? A confirmation email will be sent.`)) return;
    setConfirmingId(uniqueId);
    try {
      const res = await fetch(`/api/admin/users/${uniqueId}`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} confirmed. Email sent.`);
        router.refresh();
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

  const callDismissApi = useCallback(
    async (action: "email" | "delete", entriesToProcess: PaystackEntry[]) => {
      const res = await fetch("/api/admin/paystack-transactions/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          entries: entriesToProcess.map((e) => ({
            reference: e.reference,
            email: e.customerEmail,
            name: e.fullName,
            uniqueId: e.uniqueId,
            isBulk: e.isBulk,
            bulkEmails: e.bulkRegistrations?.map((r) => ({
              email: r.email,
              name: r.fullName,
            })),
          })),
        }),
      });
      return res.json();
    },
    []
  );

  const handleSendEmail = async (entry: PaystackEntry) => {
    setSendingEmailRefs((prev) => new Set(prev).add(entry.reference));
    try {
      const data = await callDismissApi("email", [entry]);
      if (data.success) {
        toast.success(data.message || "Re-registration email sent.");
      } else {
        toast.error(data.error || "Failed to send email.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setSendingEmailRefs((prev) => {
        const next = new Set(prev);
        next.delete(entry.reference);
        return next;
      });
    }
  };

  const handleDelete = async (entry: PaystackEntry) => {
    if (
      !window.confirm(
        `Delete this entry for "${entry.fullName}"?\n\nA re-registration email will be sent to ${entry.customerEmail || "the registrant(s)"}.\n\nAny accommodation slot(s) will be freed automatically.`
      )
    )
      return;

    setDismissingRefs((prev) => new Set(prev).add(entry.reference));
    try {
      const data = await callDismissApi("delete", [entry]);
      if (data.success) {
        toast.success(data.message || "Entry deleted and email sent.");
        setDismissedRefs((prev) => new Set(prev).add(entry.reference));
        setSelectedRefs((prev) => {
          const next = new Set(prev);
          next.delete(entry.reference);
          return next;
        });
      } else {
        toast.error(data.error || "Failed to delete.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setDismissingRefs((prev) => {
        const next = new Set(prev);
        next.delete(entry.reference);
        return next;
      });
    }
  };

  const handleMakePayment = async (entry: PaystackEntry) => {
    const isBulk = entry.isBulk;

    if (!isBulk && !entry.uniqueId) {
      toast.error("No registration ID found for this entry. Cannot generate payment link.");
      return;
    }

    const who = isBulk
      ? `${entry.bulkCount} registrant(s) in this bulk payment`
      : `"${entry.fullName}" (${entry.customerEmail})`;

    if (
      !window.confirm(
        `Generate a new Paystack payment link for ${who}?\n\nYou will be redirected to the Paystack payment page. After payment you will be returned here and the registration(s) will be confirmed automatically.`
      )
    )
      return;

    setMakingPaymentRefs((prev) => new Set(prev).add(entry.reference));
    try {
      const res = await fetch("/api/admin/paystack-transactions/make-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: entry.customerEmail,
          amount: entry.amount,
          uniqueId: entry.uniqueId,
          fullName: entry.fullName,
          reference: entry.reference,
          isBulk,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Redirect in same tab — callback will bring admin back here
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.error || "Failed to generate payment link.");
        setMakingPaymentRefs((prev) => {
          const next = new Set(prev);
          next.delete(entry.reference);
          return next;
        });
      }
    } catch {
      toast.error("An error occurred generating the payment link.");
      setMakingPaymentRefs((prev) => {
        const next = new Set(prev);
        next.delete(entry.reference);
        return next;
      });
    }
  };

  const handleBulkAction = async (action: "email" | "delete") => {
    const entriesToProcess = filtered.filter(
      (e) => selectedRefs.has(e.reference) && e.paystackStatus !== "success"
    );

    if (entriesToProcess.length === 0) {
      toast.error("No failed or abandoned entries selected.");
      return;
    }

    const actionLabel =
      action === "delete"
        ? `delete ${entriesToProcess.length} entry(ies) and send re-registration emails`
        : `send re-registration emails to ${entriesToProcess.length} entry(ies)`;

    if (!window.confirm(`Are you sure you want to ${actionLabel}?\n\nAccommodation slots will be freed for deleted entries.`))
      return;

    setBulkActioning(true);
    try {
      const data = await callDismissApi(action, entriesToProcess);
      if (data.success) {
        toast.success(data.message || "Action completed.");
        if (action === "delete") {
          setDismissedRefs((prev) => {
            const next = new Set(prev);
            entriesToProcess.forEach((e) => next.add(e.reference));
            return next;
          });
        }
        setSelectedRefs(new Set());
      } else {
        toast.error(data.error || "Action failed.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setBulkActioning(false);
    }
  };

  const getDisplayStatus = (e: PaystackEntry) => {
    if (e.dbStatus === "Confirmed") return { label: "Confirmed", cls: "bg-green-100 text-green-800" };
    if (e.paystackStatus === "success" && !e.inDb) return { label: "Not in DB", cls: "bg-orange-100 text-orange-800" };
    if (e.paystackStatus === "success" && e.dbStatus === "Pending") return { label: "Pending", cls: "bg-yellow-100 text-yellow-800" };
    if (e.paystackStatus === "success" && !e.dbStatus) return { label: "Pending", cls: "bg-yellow-100 text-yellow-800" };
    if (e.paystackStatus === "abandoned") return { label: "Abandoned", cls: "bg-orange-100 text-orange-800" };
    if (e.paystackStatus === "failed") return { label: "Failed", cls: "bg-red-100 text-red-800" };
    return { label: e.paystackStatus, cls: "bg-gray-100 text-gray-800" };
  };

  const isFailedOrAbandoned = (e: PaystackEntry) =>
    e.paystackStatus === "failed" || e.paystackStatus === "abandoned";

  const selectedFailedCount = [...selectedRefs].filter((ref) => {
    const entry = entries.find((e) => e.reference === ref);
    return entry && isFailedOrAbandoned(entry);
  }).length;

  const selectedNotInDbCount = [...selectedRefs].filter((ref) => {
    const entry = entries.find((e) => e.reference === ref);
    return entry && entry.paystackStatus === "success" && !entry.inDb;
  }).length;

  const selectedPendingCount = [...selectedRefs].filter((ref) => {
    const entry = entries.find((e) => e.reference === ref);
    return (
      entry &&
      entry.paystackStatus === "success" &&
      entry.inDb &&
      entry.dbStatus !== "Confirmed" &&
      !!entry.uniqueId
    );
  }).length;

  const callAddToDbApi = useCallback(async (entriesToAdd: PaystackEntry[]) => {
    const res = await fetch("/api/admin/paystack-transactions/add-to-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: entriesToAdd.map((e) => ({
          reference: e.reference,
          email: e.customerEmail,
          fullName: e.fullName,
          uniqueId: e.uniqueId,
          amount: e.amount,
          isBulk: e.isBulk,
          bulkRegistrations: e.bulkRegistrations?.map((r) => ({
            email: r.email,
            fullName: r.fullName,
            title: r.title,
          })),
        })),
      }),
    });
    return res.json();
  }, []);

  const handleAddToDb = async (entry: PaystackEntry) => {
    if (
      !window.confirm(
        `Add "${entry.fullName}" to the database?\n\nA confirmation email will be sent to ${
          entry.isBulk ? `${entry.bulkCount} registrant(s)` : entry.customerEmail
        }.`
      )
    )
      return;

    setAddingToDbRefs((prev) => new Set(prev).add(entry.reference));
    try {
      const data = await callAddToDbApi([entry]);
      if (data.success) {
        toast.success(data.message || "Added to database.");
        // Mark as now in DB optimistically
        setEntries((prev) =>
          prev.map((e) =>
            e.reference === entry.reference ? { ...e, inDb: true, dbStatus: "Confirmed" } : e
          )
        );
      } else {
        toast.error(data.error || "Failed to add to database.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setAddingToDbRefs((prev) => {
        const next = new Set(prev);
        next.delete(entry.reference);
        return next;
      });
    }
  };

  const handleBulkAddToDb = async () => {
    const entriesToAdd = filtered.filter(
      (e) => selectedRefs.has(e.reference) && e.paystackStatus === "success" && !e.inDb
    );
    if (entriesToAdd.length === 0) {
      toast.error("No 'Not in DB' entries selected.");
      return;
    }
    if (
      !window.confirm(
        `Add ${entriesToAdd.length} entry(ies) to the database?\n\nConfirmation emails will be sent to all registrants.`
      )
    )
      return;

    setBulkAddingToDb(true);
    try {
      const data = await callAddToDbApi(entriesToAdd);
      if (data.success) {
        toast.success(data.message || "Entries added to database.");
        const addedRefs = new Set(entriesToAdd.map((e) => e.reference));
        setEntries((prev) =>
          prev.map((e) =>
            addedRefs.has(e.reference) ? { ...e, inDb: true, dbStatus: "Confirmed" } : e
          )
        );
        setSelectedRefs(new Set());
      } else {
        toast.error(data.error || "Action failed.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setBulkAddingToDb(false);
    }
  };

  const handleBulkConfirmPending = async () => {
    const pendingEntries = filtered.filter(
      (e) =>
        selectedRefs.has(e.reference) &&
        e.paystackStatus === "success" &&
        e.inDb &&
        e.dbStatus !== "Confirmed" &&
        !!e.uniqueId
    );
    if (pendingEntries.length === 0) {
      toast.error("No pending entries with a registration ID selected.");
      return;
    }
    if (
      !window.confirm(
        `Confirm ${pendingEntries.length} pending registration(s)?\n\nConfirmation emails will be sent to all.`
      )
    )
      return;

    setBulkConfirmingPending(true);
    try {
      const res = await fetch("/api/admin/users/bulk-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniqueIds: pendingEntries.map((e) => e.uniqueId!),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Registrations confirmed.");
        const confirmedUids = new Set(pendingEntries.map((e) => e.uniqueId));
        setEntries((prev) =>
          prev.map((e) =>
            confirmedUids.has(e.uniqueId) ? { ...e, dbStatus: "Confirmed" } : e
          )
        );
        setSelectedRefs(new Set());
      } else {
        toast.error(data.error || "Action failed.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setBulkConfirmingPending(false);
    }
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
      <div className="bg-white rounded-lg shadow border p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
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
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending Confirmation</option>
            <option value="Not in DB">Not in DB</option>
            <option value="Failed">Failed</option>
            <option value="Abandoned">Abandoned</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Calendar className="w-4 h-4 text-gray-400 hidden sm:block" />
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm text-gray-600 whitespace-nowrap">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm text-gray-600 whitespace-nowrap">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-xs text-red-600 hover:underline whitespace-nowrap"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedRefs.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-indigo-800">
            {selectedRefs.size} selected
            {selectedNotInDbCount > 0 && ` · ${selectedNotInDbCount} not in DB`}
            {selectedPendingCount > 0 && ` · ${selectedPendingCount} pending`}
            {selectedFailedCount > 0 && ` · ${selectedFailedCount} failed/abandoned`}
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            {/* Add to DB — for Not in DB entries */}
            <button
              onClick={handleBulkAddToDb}
              disabled={bulkAddingToDb || bulkActioning || bulkConfirmingPending || selectedNotInDbCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {bulkAddingToDb ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
              Add to DB ({selectedNotInDbCount})
            </button>

            {/* Confirm Pending — for Pending entries */}
            <button
              onClick={handleBulkConfirmPending}
              disabled={bulkConfirmingPending || bulkActioning || bulkAddingToDb || selectedPendingCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {bulkConfirmingPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
              Confirm Pending ({selectedPendingCount})
            </button>

            {/* Send Re-register Email — for Failed/Abandoned */}
            <button
              onClick={() => handleBulkAction("email")}
              disabled={bulkActioning || bulkAddingToDb || bulkConfirmingPending || selectedFailedCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {bulkActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
              Send Re-register ({selectedFailedCount})
            </button>

            {/* Delete & Send Email — for Failed/Abandoned */}
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={bulkActioning || bulkAddingToDb || bulkConfirmingPending || selectedFailedCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {bulkActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete &amp; Email ({selectedFailedCount})
            </button>

            <button
              onClick={() => setSelectedRefs(new Set())}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginated.map((e) => {
                  const { label, cls } = getDisplayStatus(e);
                  const isFailed = isFailedOrAbandoned(e);
                  const isExpanded = expandedRef === e.reference;
                  const isDismissing = dismissingRefs.has(e.reference);
                  const isSendingEmail = sendingEmailRefs.has(e.reference);
                  const isMakingPayment = makingPaymentRefs.has(e.reference);
                  const isAddingToDb = addingToDbRefs.has(e.reference);

                  return (
                    <>
                      <tr key={e.reference} className={`hover:bg-gray-50 ${selectedRefs.has(e.reference) ? "bg-indigo-50" : ""}`}>
                        {/* Checkbox */}
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRefs.has(e.reference)}
                            onChange={(ev) => handleSelectOne(e.reference, ev.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Name / Email */}
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{e.fullName}</div>
                          <div className="text-xs text-gray-500">{e.customerEmail}</div>
                          {e.uniqueId && (
                            <div className="text-xs text-blue-600">{e.uniqueId}</div>
                          )}
                          {e.isBulk && (
                            <button
                              onClick={() => setExpandedRef(isExpanded ? null : e.reference)}
                              className="inline-flex items-center gap-1 mt-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded hover:bg-purple-200 transition"
                            >
                              <Users className="w-3 h-3" />
                              Bulk × {e.bulkCount}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </td>

                        {/* Reference */}
                        <td className="px-4 py-3 text-xs text-gray-600 font-mono">{e.reference}</td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                          ₦{e.amount.toLocaleString()}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {e.paidAt
                            ? new Date(e.paidAt).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}>
                            {label}
                          </span>
                          {!e.inDb && e.paystackStatus === "success" && (
                            <div className="text-xs text-orange-600 mt-1">Not saved in DB</div>
                          )}
                          {/* Gateway response for failed / abandoned — confirms payment was NOT approved */}
                          {isFailed && (
                            <div className="mt-1.5 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Gateway:</span>
                                <span className={`text-xs font-medium ${
                                  e.gatewayResponse?.toLowerCase().includes("approved")
                                    ? "text-green-700"
                                    : "text-red-600"
                                }`}>
                                  {e.gatewayResponse || "No response"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Auth:</span>
                                <span className={`text-xs font-medium ${
                                  e.authorizationCode ? "text-green-700" : "text-red-600"
                                }`}>
                                  {e.authorizationCode ? `Approved (${e.authorizationCode})` : "Not Approved"}
                                </span>
                              </div>
                              {e.paymentChannel && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Via:</span>
                                  <span className="text-xs text-gray-600 capitalize">{e.paymentChannel}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            {/* Confirm button (success, unconfirmed, in DB) */}
                            {e.paystackStatus === "success" && e.dbStatus !== "Confirmed" && e.uniqueId && (
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
                            )}

                            {/* Already confirmed */}
                            {e.dbStatus === "Confirmed" && (
                              <span className="inline-flex items-center text-xs text-green-700 gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Confirmed
                              </span>
                            )}

                            {/* Add to DB button (success but not in DB) */}
                            {e.paystackStatus === "success" && !e.inDb && (
                              <button
                                onClick={() => handleAddToDb(e)}
                                disabled={isAddingToDb || isDismissing}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isAddingToDb ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <UserPlus className="w-3 h-3 mr-1" />
                                )}
                                Add to DB
                              </button>
                            )}

                            {/* Send re-register email (failed / abandoned) */}
                            {isFailed && (
                              <button
                                onClick={() => handleSendEmail(e)}
                                disabled={isSendingEmail || isDismissing}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isSendingEmail ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Mail className="w-3 h-3 mr-1" />
                                )}
                                Send Email
                              </button>
                            )}

                            {/* Delete (failed / abandoned) */}
                            {isFailed && (
                              <button
                                onClick={() => handleDelete(e)}
                                disabled={isDismissing || isSendingEmail || isMakingPayment}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isDismissing ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3 mr-1" />
                                )}
                                Delete
                              </button>
                            )}

                            {/* Make Payment (abandoned — payment was never completed; single needs uniqueId, bulk needs reference) */}
                            {e.paystackStatus === "abandoned" && (e.uniqueId || e.isBulk) && (
                              <button
                                onClick={() => handleMakePayment(e)}
                                disabled={isMakingPayment || isDismissing || isSendingEmail}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isMakingPayment ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <CreditCard className="w-3 h-3 mr-1" />
                                )}
                                Make Payment
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Bulk registrants dropdown row */}
                      {isExpanded && e.isBulk && e.bulkRegistrations && (
                        <tr key={`${e.reference}-bulk`} className="bg-purple-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-semibold text-purple-800">
                                Bulk Registration — {e.bulkRegistrations.length} registrant(s)
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-xs text-purple-700 uppercase">
                                    <th className="text-left pb-2 pr-4 font-semibold">#</th>
                                    <th className="text-left pb-2 pr-4 font-semibold">Full Name</th>
                                    <th className="text-left pb-2 pr-4 font-semibold">Email</th>
                                    <th className="text-left pb-2 font-semibold">Title</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-100">
                                  {e.bulkRegistrations.map((r, idx) => (
                                    <tr key={idx} className="hover:bg-purple-100">
                                      <td className="py-1.5 pr-4 text-gray-500 text-xs">{idx + 1}</td>
                                      <td className="py-1.5 pr-4 font-medium text-gray-800">{r.fullName}</td>
                                      <td className="py-1.5 pr-4 text-gray-600">{r.email || "—"}</td>
                                      <td className="py-1.5 text-gray-600">{r.title || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
                <span className="font-medium">
                  {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                {" "}–{" "}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>
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
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm text-gray-700">
                        …
                      </span>
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

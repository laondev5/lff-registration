"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Download,
  ShieldCheck,
  Mail,
  RefreshCw,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface User {
  uniqueId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsapp: string;
  state: string;
  country: string;
  churchDetails: string;
  attendanceType: string;
  isLFFMember: string;
  needsAccommodation: string;
  accommodationType: string;
  paymentProof: string;
  registrationStatus: string;
  gender: string;
  createdAt?: string;
}

export default function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const usersPerPage = 20;

  const stats = useMemo(() => ({
    total: users.length,
    confirmed: users.filter((u) => u.registrationStatus === "Confirmed").length,
    pending: users.filter((u) => u.registrationStatus === "Pending").length,
    withAccommodation: users.filter((u) => !!u.needsAccommodation && u.needsAccommodation !== "No").length,
  }), [users]);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm);

      const matchesStatus =
        statusFilter === "All" || user.registrationStatus === statusFilter;

      const regDate = user.createdAt ? new Date(user.createdAt) : null;
      const matchesFrom = !dateFrom || (regDate && regDate >= new Date(dateFrom));
      const matchesTo = !dateTo || (regDate && regDate <= new Date(dateTo + "T23:59:59"));

      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [users, searchTerm, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const handleDelete = async (uniqueId: string, fullName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the registration for "${fullName}"? This will free up their accommodation slot.`,
    );
    if (!confirmed) return;
    setOpenDropdownId(null);
    setDeletingId(uniqueId);
    try {
      const res = await fetch(`/api/admin/users/${uniqueId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Registration for ${fullName} has been deleted.`);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete registration.");
      }
    } catch {
      toast.error("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirm = async (uniqueId: string, fullName: string) => {
    const confirmed = window.confirm(
      `Manually confirm registration for "${fullName}"? A confirmation email with their ID will be sent.`
    );
    if (!confirmed) return;
    setOpenDropdownId(null);
    setConfirmingId(uniqueId);
    try {
      const res = await fetch(`/api/admin/users/${uniqueId}`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        toast.success(`${fullName} confirmed. Confirmation email sent.`);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to confirm registration.");
      }
    } catch {
      toast.error("An error occurred while confirming.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleResendEmail = async (uniqueId: string, fullName: string) => {
    const confirmed = window.confirm(`Resend confirmation email to ${fullName}?`);
    if (!confirmed) return;
    setOpenDropdownId(null);
    setResendingId(uniqueId);
    try {
      const res = await fetch(`/api/admin/users/${uniqueId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Confirmation email resent to ${fullName}.`);
      } else {
        toast.error(data.error || "Failed to resend email.");
      }
    } catch {
      toast.error("An error occurred while resending.");
    } finally {
      setResendingId(null);
    }
  };

  const handleEditEmail = (uniqueId: string, currentEmail: string) => {
    setEditingEmailId(uniqueId);
    setEditEmailValue(currentEmail);
    setOpenDropdownId(null);
  };

  const handleSaveEmail = async () => {
    if (!editingEmailId || !editEmailValue.trim()) return;
    setSavingEmail(true);
    try {
      const res = await fetch(`/api/admin/users/${editingEmailId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmailValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email updated successfully.");
        setEditingEmailId(null);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to update email.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setSavingEmail(false);
    }
  };

  const getExportData = () =>
    filteredUsers.map(user => ({
      ID: user.uniqueId,
      Name: user.fullName,
      Email: user.email,
      Phone: user.phoneNumber,
      WhatsApp: user.whatsapp,
      Gender: user.gender,
      State: user.state,
      Country: user.country,
      "Attendance Type": user.attendanceType,
      "Church Details": user.churchDetails,
      "Is LFF Member": user.isLFFMember,
      "Needs Accommodation": user.needsAccommodation ? "Yes" : "No",
      "Accommodation Type": user.accommodationType || "N/A",
      Status: user.registrationStatus,
      "Registered On": user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—",
    }));

  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(getExportData());
    const blob = new Blob([XLSX.utils.sheet_to_csv(worksheet)], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `registrations_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(getExportData());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(blob, `registrations_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Registered</p>
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
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">With Accommodation</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.withAccommodation}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, email, ID, or phone..."
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
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <div className="relative group z-20">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto justify-center">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <ul className="py-1">
                <li>
                  <button onClick={exportToCSV} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Export to CSV
                  </button>
                </li>
                <li>
                  <button onClick={exportToExcel} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Export to Excel
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <span className="text-sm text-gray-500 font-medium shrink-0">Filter by date:</span>
          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-xs text-red-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border" ref={tableRef}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accommodation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Proof</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.uniqueId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <a href={`/admin/users/${user.uniqueId}`} className="hover:text-primary hover:underline">
                        {user.fullName}
                      </a>
                    </div>
                    <div className="text-xs text-gray-400">{user.uniqueId}</div>
                    <div className="text-sm text-gray-500">{user.gender}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">WA: {user.whatsapp}</div>
                    <div className="text-sm text-gray-500">Ph: {user.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.attendanceType}</div>
                    <div className="text-xs text-gray-500">{user.churchDetails}</div>
                    <div className="text-xs text-gray-500">{user.state}, {user.country}</div>
                    {user.isLFFMember === "yes" && (
                      <span className="inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                        LFF Member
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.needsAccommodation && user.needsAccommodation !== "No" ? "Required" : "No"}
                    </div>
                    {user.accommodationType && (
                      <div className="text-sm text-gray-500">{user.accommodationType}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.paymentProof ? (
                      <a href={user.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 text-sm underline">
                        View Proof
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs italic">No proof</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.registrationStatus === "Confirmed" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                        <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdownId(prev => prev === user.uniqueId ? null : user.uniqueId)}
                        className="inline-flex items-center px-2 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openDropdownId === user.uniqueId && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
                          <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-gray-100 z-20">
                            <div className="py-1">
                              {user.registrationStatus !== "Confirmed" && (
                                <button
                                  onClick={() => handleConfirm(user.uniqueId, user.fullName)}
                                  disabled={confirmingId === user.uniqueId}
                                  className="flex items-center w-full px-3 py-2 text-xs text-green-700 hover:bg-green-50 gap-2 disabled:opacity-50"
                                >
                                  {confirmingId === user.uniqueId
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <ShieldCheck className="w-3.5 h-3.5" />}
                                  Confirm
                                </button>
                              )}
                              {user.registrationStatus === "Confirmed" && (
                                <button
                                  onClick={() => handleResendEmail(user.uniqueId, user.fullName)}
                                  disabled={resendingId === user.uniqueId}
                                  className="flex items-center w-full px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 gap-2 disabled:opacity-50"
                                >
                                  {resendingId === user.uniqueId
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Mail className="w-3.5 h-3.5" />}
                                  Resend Email
                                </button>
                              )}
                              <button
                                onClick={() => handleEditEmail(user.uniqueId, user.email)}
                                className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit Email
                              </button>
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                onClick={() => handleDelete(user.uniqueId, user.fullName)}
                                disabled={deletingId === user.uniqueId}
                                className="flex items-center w-full px-3 py-2 text-xs text-red-700 hover:bg-red-50 gap-2 disabled:opacity-50"
                              >
                                {deletingId === user.uniqueId
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />}
                                Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {filteredUsers.length === 0 ? 0 : Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)}
                </span>{" "}
                to{" "}
                <span className="font-medium">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span>{" "}
                of <span className="font-medium">{filteredUsers.length}</span> results
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
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Edit Email Modal */}
      {editingEmailId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Edit Email Address</h3>
            <p className="text-sm text-gray-500 mb-4">Update the registrant&apos;s email address below.</p>
            <input
              type="email"
              value={editEmailValue}
              onChange={(e) => setEditEmailValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEmail()}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter new email address"
              autoFocus
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => setEditingEmailId(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmail}
                disabled={savingEmail || !editEmailValue.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

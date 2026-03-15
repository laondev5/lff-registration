"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Download,
  ShieldCheck,
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
}

export default function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const usersPerPage = 20;

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

      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleDelete = async (uniqueId: string, fullName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the registration for "${fullName}"? This will free up their accommodation slot.`,
    );
    if (!confirmed) return;

    setDeletingId(uniqueId);
    try {
      const res = await fetch(`/api/admin/users/${uniqueId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Registration for ${fullName} has been deleted.`);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete registration.");
      }
    } catch (err) {
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

  const getExportData = () => {
    return filteredUsers.map(user => ({
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
      Status: user.registrationStatus
    }));
  };

  const exportToCSV = () => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `registrations_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToExcel = () => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(blob, `registrations_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
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
        
        <div className="relative group z-20">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto justify-center">
            <Download className="w-4 h-4" /> Export
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <ul className="py-1">
              <li>
                <button
                  onClick={exportToCSV}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export to CSV
                </button>
              </li>
              <li>
                <button
                  onClick={exportToExcel}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export to Excel
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name/Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Accommodation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Proof
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.map((user) => (
              <tr key={user.uniqueId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    <a
                      href={`/admin/users/${user.uniqueId}`}
                      className="hover:text-primary hover:underline"
                    >
                      {user.fullName}
                    </a>
                  </div>
                  <div className="text-xs text-gray-400">{user.uniqueId}</div>
                  <div className="text-sm text-gray-500">{user.gender}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                  <div className="text-sm text-gray-500">
                    WA: {user.whatsapp}
                  </div>
                  <div className="text-sm text-gray-500">
                    Ph: {user.phoneNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.attendanceType}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.churchDetails}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.state}, {user.country}
                  </div>
                  {user.isLFFMember === "yes" && (
                    <span className="inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                      LFF Member
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.needsAccommodation ? "Required" : "No"}
                  </div>
                  {user.accommodationType && (
                    <div className="text-sm text-gray-500">
                      {user.accommodationType}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.paymentProof ? (
                    <a
                      href={user.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 text-sm underline"
                    >
                      View Proof
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs italic">
                      No proof
                    </span>
                  )}
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
                  <div className="flex flex-col gap-1.5">
                    {user.registrationStatus !== "Confirmed" && (
                      <button
                        onClick={() => handleConfirm(user.uniqueId, user.fullName)}
                        disabled={confirmingId === user.uniqueId}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {confirmingId === user.uniqueId ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 mr-1" />
                        )}
                        Confirm
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.uniqueId, user.fullName)}
                      disabled={deletingId === user.uniqueId}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingId === user.uniqueId ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 mr-1" />
                      )}
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
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
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {filteredUsers.length === 0 ? 0 : Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * usersPerPage, filteredUsers.length)}
                </span>{" "}
                of <span className="font-medium">{filteredUsers.length}</span> results
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
                {/* Simple page numbers approach for when pages are not extremely high */}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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

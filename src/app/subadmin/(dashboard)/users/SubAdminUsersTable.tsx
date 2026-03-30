"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface User {
  uniqueId: string;
  title: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsapp: string;
  state: string;
  country: string;
  churchDetails: string;
  areaDistrict: string;
  attendanceType: string;
  busInterest: string;
  mealCollection: string;
  prayerRequest: string;
  registrationType: string;
  registrationAmount: string;
  isLFFMember: string;
  needsAccommodation: string;
  accommodationType: string;
  price: string;
  duration: string;
  paymentProof: string;
  registrationStatus: string;
  paymentReference: string;
  gender: string;
}

export default function SubAdminUsersTable({ users }: { users: User[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [accommodationFilter, setAccommodationFilter] = useState("All");
  const [titleFilter, setTitleFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const usersPerPage = 20;

  const availableTitles = useMemo(() => {
    const titles = [...new Set(users.map((u) => u.title).filter(Boolean))];
    const order = ["Child", "Teenager", "Bro", "Sis", "Exhorter", "Deacon", "Deaconess", "Pastor", "District Pastor", "Elders", "Minister", "VIP"];
    return titles.sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm) ||
        (user.accommodationType || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || user.registrationStatus === statusFilter;

      const hasAccommodation = !!user.needsAccommodation && user.needsAccommodation !== "No";
      const matchesAccommodation =
        accommodationFilter === "All" ||
        (accommodationFilter === "With Accommodation" && hasAccommodation) ||
        (accommodationFilter === "No Accommodation" && !hasAccommodation);

      const matchesTitle =
        titleFilter === "All" || (user.title || "") === titleFilter;

      return matchesSearch && matchesStatus && matchesAccommodation && matchesTitle;
    });
  }, [users, searchTerm, statusFilter, accommodationFilter, titleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, accommodationFilter, titleFilter]);

  // Selection helpers
  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.uniqueId));
  const someSelected = filteredUsers.some((u) => selectedIds.has(u.uniqueId));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredUsers.forEach((u) => (checked ? next.add(u.uniqueId) : next.delete(u.uniqueId)));
      return next;
    });
  };

  const handleSelectOne = (uniqueId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(uniqueId) : next.delete(uniqueId);
      return next;
    });
  };

  const getExportData = () => {
    const source =
      selectedIds.size > 0
        ? filteredUsers.filter((u) => selectedIds.has(u.uniqueId))
        : filteredUsers;
    return source.map((user) => ({
      "Unique ID": user.uniqueId,
      Title: user.title || "",
      "Full Name": user.fullName,
      Email: user.email,
      Phone: user.phoneNumber,
      WhatsApp: user.whatsapp,
      Gender: user.gender,
      State: user.state,
      Country: user.country,
      "Area / District": user.areaDistrict || "",
      "Attendance Type": user.attendanceType,
      "Church Details": user.churchDetails,
      "Is LFF Member": user.isLFFMember,
      "Registration Type": user.registrationType || "",
      "Registration Amount": user.registrationAmount || "",
      "Bus Interest": user.busInterest || "",
      "Meal Collection": user.mealCollection || "",
      "Prayer Request": user.prayerRequest || "",
      "Needs Accommodation": user.needsAccommodation && user.needsAccommodation !== "No" ? "Yes" : "No",
      "Accommodation Type": user.accommodationType || "",
      "Accommodation Price": user.price || "",
      "Accommodation Duration": user.duration || "",
      "Payment Reference": user.paymentReference || "",
      Status: user.registrationStatus,
    }));
  };

  const exportToCSV = () => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const blob = new Blob([XLSX.utils.sheet_to_csv(worksheet)], { type: "text/csv;charset=utf-8;" });
    const label = selectedIds.size > 0 ? `selected_${selectedIds.size}` : "filtered";
    saveAs(blob, `registrations_${label}_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportToExcel = () => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    const label = selectedIds.size > 0 ? `selected_${selectedIds.size}` : "filtered";
    saveAs(blob, `registrations_${label}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const stats = useMemo(() => ({
    total: users.length,
    confirmed: users.filter((u) => u.registrationStatus === "Confirmed").length,
    pending: users.filter((u) => u.registrationStatus !== "Confirmed").length,
    withAccommodation: users.filter((u) => !!u.needsAccommodation && u.needsAccommodation !== "No").length,
  }), [users]);

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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search by name, email, ID, phone, or accommodation..."
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
        <select
          value={accommodationFilter}
          onChange={(e) => setAccommodationFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="All">All Accommodation</option>
          <option value="With Accommodation">With Accommodation</option>
          <option value="No Accommodation">No Accommodation</option>
        </select>
        <select
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="All">All Titles</option>
          {availableTitles.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="relative group z-20">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto justify-center">
            <Download className="w-4 h-4" />
            {selectedIds.size > 0 ? `Export (${selectedIds.size})` : "Export"}
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

      {/* Selection bar */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-indigo-800">
            {selectedIds.size} of {filteredUsers.length} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <div className="relative group z-20">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition">
                <Download className="w-3 h-3" /> Export {selectedIds.size} selected
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
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
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allFilteredSelected; }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  title={allFilteredSelected ? "Deselect all" : "Select all filtered"}
                />
              </th>
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.map((user) => (
              <tr key={user.uniqueId} className={`hover:bg-gray-50 ${selectedIds.has(user.uniqueId) ? "bg-indigo-50" : ""}`}>
                <td className="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(user.uniqueId)}
                    onChange={(e) => handleSelectOne(user.uniqueId, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/subadmin/users/${user.uniqueId}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {user.fullName}
                  </Link>
                  <div className="text-xs text-gray-400">{user.uniqueId}</div>
                  <div className="text-sm text-gray-500">{user.gender}</div>
                  {user.title && (
                    <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 mt-0.5">
                      {user.title}
                    </span>
                  )}
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
                    <a
                      href={user.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 text-sm underline"
                    >
                      View Proof
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs italic">No proof</span>
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
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
    </div>
  );
}

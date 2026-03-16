"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export default function SubAdminAccommodationsClient({ accommodations }: { accommodations: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("All");

  const stats = useMemo(() => {
    const total = accommodations.length;
    const totalSlots = accommodations.reduce((sum, acc) => sum + (parseInt(acc.slots) || 0), 0);
    const fullyBooked = accommodations.filter((acc) => acc.slots !== "0" && acc.slots && (acc.remainingSlots ?? acc.slots) === 0).length;
    const available = total - fullyBooked;
    return { total, totalSlots, fullyBooked, available };
  }, [accommodations]);

  const filteredAccommodations = useMemo(() => accommodations.filter((acc) => {
    const matchesSearch =
      searchTerm === "" ||
      acc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const isFree = acc.price === "Free" || acc.price === "0" || !acc.price;
    const matchesPrice =
      priceFilter === "All" ||
      (priceFilter === "Free" && isFree) ||
      (priceFilter === "Paid" && !isFree);

    return matchesSearch && matchesPrice;
  }), [searchTerm, priceFilter, accommodations]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Accommodations</h1>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Available</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.available}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Fully Booked</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.fullyBooked}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Slots</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalSlots || "—"}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{filteredAccommodations.length} result{filteredAccommodations.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search accommodations by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="All">All Prices</option>
          <option value="Paid">Paid</option>
          <option value="Free">Free</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slots
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccommodations.map((acc: any, index: number) => (
                <tr key={acc.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {acc.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {acc.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {acc.price === "Free" || acc.price === "0" || !acc.price ? "Free" : `₦${parseInt(acc.price?.toString().replace(/[^0-9]/g, "") || "0").toLocaleString()}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {acc.slots === '0' || !acc.slots ? 'Unlimited' : (
                         <div className="flex flex-col">
                           <span className="font-bold">{acc.remainingSlots ?? acc.slots} Left</span>
                           <span className="text-xs text-gray-500">of {acc.slots} total slots</span>
                         </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {acc.imageUrl ? (
                      <img
                        src={acc.imageUrl}
                        alt={acc.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs italic">No image</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAccommodations.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No accommodations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

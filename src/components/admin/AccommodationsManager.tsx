"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, X, LayoutGrid, List } from "lucide-react";
import Image from "next/image";

interface Accommodation {
  id: string;
  title: string;
  description: string;
  price: string;
  slots: string;
  bookedSlots?: number;
  remainingSlots?: number;
  isFullyBooked?: boolean;
  imageUrl: string;
  fileId?: string;
  days?: string;
  accessTags?: string[];
}

const TITLES = [
  "Child",
  "Teenager",
  "Bro",
  "Sis",
  "Exhorter",
  "Deacon",
  "Deaconess",
  "Snr Deacon",
  "Snr Deaconess",
  "Pastor",
  "District Pastor",
  "Elders",
  "Minister",
  "VIP",
];

export default function AccommodationsManager({
  initialData,
}: {
  initialData: Accommodation[];
}) {
  const [accommodations, setAccommodations] =
    useState<Accommodation[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Form State
  const [currentId, setCurrentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [slots, setSlots] = useState("");
  const [days, setDays] = useState("1");
  const [accessTags, setAccessTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);

  const router = useRouter();

  // Fetch departments for tags
  useEffect(() => {
    async function fetchDepts() {
      try {
        const res = await fetch("/api/admin/departments");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    }
    fetchDepts();
  }, []);

  const openModal = (acc?: Accommodation) => {
    if (acc) {
      setIsEditing(true);
      setCurrentId(acc.id);
      setTitle(acc.title);
      setDescription(acc.description);
      setPrice(acc.price);
      setSlots(acc.slots);
      setDays(acc.days || "1");
      setAccessTags(acc.accessTags || []);
    } else {
      setIsEditing(false);
      setCurrentId("");
      setTitle("");
      setDescription("");
      setPrice("");
      setSlots("");
      setDays("1");
      setAccessTags([]);
      setImageUrl("");
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("slots", slots);
    formData.append("days", days);
    formData.append("accessTags", JSON.stringify(accessTags));

    if (file) {
      formData.append("file", file);
    }
    if (imageUrl) {
      formData.append("imageUrl", imageUrl);
    }

    if (isEditing) {
      formData.append("id", currentId);
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/admin/accommodations", {
        method,
        body: formData,
      });

      if (res.ok) {
        // Refresh data
        router.refresh();
        // Optimistic update or just fetch again?
        // Since router.refresh() refreshes the server component, but we are in a client component
        // receiving initialData, we might not see updates immediately unless we fetch or reload.
        // Better to simple reload window or fetch updated list.
        // For a smooth experience, let's fetch list again or just reload page.
        window.location.reload();
      } else {
        alert("Failed to save accommodation");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this accommodation?")) return;

    try {
      const res = await fetch(`/api/admin/accommodations?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAccommodations((prev) => prev.filter((a) => a.id !== id));
        router.refresh();
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Accommodations</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded ${viewMode === "table" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
              title="Table View"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus size={18} className="mr-2" />
            Add New
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accommodations.map((acc) => (
            <div
              key={acc.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border"
            >
              <div className="relative h-48 w-full bg-gray-200">
                {/* Use simple img tag if optimization is tricky with external google drive links */}
                <img
                  src={acc.imageUrl || "/placeholder.jpg"}
                  alt={acc.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900">{acc.title}</h3>
                <p className="text-blue-600 font-semibold mt-1">
                  {acc.price === "Free"
                    ? "Free"
                    : `₦${acc.price} for ${acc.days || "1"} day(s)`}
                </p>
                <p className="text-gray-500 text-sm mt-2 line-clamp-3">
                  {acc.description}
                </p>
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <div className="flex flex-col">
                         {acc.slots === '0' || !acc.slots ? (
                             <span className="font-bold text-gray-900">Unlimited Slots</span>
                         ) : (
                             <>
                                <span className="font-bold text-gray-900">{acc.remainingSlots ?? acc.slots} Left</span>
                                <span className="text-xs text-gray-400">of {acc.slots} total slots</span>
                             </>
                         )}
                      </div>
                    </div>
                {acc.accessTags && acc.accessTags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {acc.accessTags.map((tag) => (
                      <span key={tag} className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block">General</div>
                )}

                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => openModal(acc)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Desc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slots
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved For
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accommodations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No accommodations found. Click "Add New" to create one.
                    </td>
                  </tr>
                ) : (
                  accommodations.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={acc.imageUrl || "/placeholder.jpg"}
                          alt={acc.title}
                          className="h-12 w-16 rounded-md object-cover"
                        />
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {acc.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {acc.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-600 font-semibold">
                          {acc.price === "Free"
                            ? "Free"
                            : `₦${acc.price} for ${acc.days || "1"} day(s)`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {acc.slots === '0' || !acc.slots ? 'Unlimited' : (
                           <div className="flex flex-col">
                             <span className="font-bold text-gray-900">{acc.remainingSlots ?? acc.slots} Left</span>
                             <span className="text-xs text-gray-400">of {acc.slots} total slots</span>
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {acc.accessTags && acc.accessTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {acc.accessTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            General
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(acc)}
                          className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center"
                        >
                          <Edit size={16} className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? "Edit Accommodation" : "Add Accommodation"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pricing
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1 text-sm text-gray-600">
                      <input
                        type="radio"
                        name="pricingType"
                        value="paid"
                        checked={price !== "Free"}
                        onChange={() => setPrice("")}
                        className="accent-blue-600"
                      />
                      Paid
                    </label>
                    <label className="flex items-center gap-1 text-sm text-gray-600">
                      <input
                        type="radio"
                        name="pricingType"
                        value="free"
                        checked={price === "Free"}
                        onChange={() => setPrice("Free")}
                        className="accent-blue-600"
                      />
                      Free
                    </label>
                  </div>
                  {price !== "Free" && (
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => {
                        // Remove all non-digit characters
                        const rawValue = e.target.value.replace(/\D/g, "");
                        if (!rawValue) {
                          setPrice("");
                          return;
                        }
                        // Format with commas
                        const formattedValue = new Intl.NumberFormat(
                          "en-US",
                        ).format(parseInt(rawValue, 10));
                        setPrice(formattedValue);
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                      placeholder="e.g. 5,000"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slots
                  </label>
                  <input
                    type="number"
                    value={slots}
                    onChange={(e) => setSlots(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Tags (Who can see this?)
                  <br />
                  <span className="text-xs text-gray-500 font-normal">
                    Leave empty for "General" (visible to everyone). Or select specific roles/departments.
                  </span>
                </label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50 space-y-4">
                  {/* Titles */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Titles</h4>
                    <div className="flex flex-wrap gap-2">
                      {TITLES.map((t) => (
                        <label key={t} className="inline-flex items-center gap-1 text-sm bg-white border px-2 py-1 rounded shadow-sm hover:bg-gray-50 cursor-pointer text-black">
                          <input
                            type="checkbox"
                            checked={accessTags.includes(t)}
                            onChange={(e) => {
                              if (e.target.checked) setAccessTags((prev) => [...prev, t]);
                              else setAccessTags((prev) => prev.filter((tag) => tag !== t));
                            }}
                            className="accent-blue-600 rounded"
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Departments */}
                  {departments.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase mt-4">Departments & Sub-Departments</h4>
                      <div className="flex flex-wrap gap-2">
                        {departments.map((dept) => (
                          <div key={dept._id || dept.name} className="flex flex-wrap gap-2 w-full">
                            <label className="inline-flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 px-2 py-1 rounded shadow-sm hover:bg-blue-100 cursor-pointer text-black">
                              <input
                                type="checkbox"
                                checked={accessTags.includes(dept.name)}
                                onChange={(e) => {
                                  if (e.target.checked) setAccessTags((prev) => [...prev, dept.name]);
                                  else setAccessTags((prev) => prev.filter((tag) => tag !== dept.name));
                                }}
                                className="accent-blue-600 rounded"
                              />
                              {dept.name}
                            </label>
                            
                            {/* Sub-departments */}
                            {dept.subDepartments?.map((sub: string) => (
                              <label key={sub} className="inline-flex items-center gap-1 text-sm bg-white border border-gray-200 px-2 py-1 rounded shadow-sm hover:bg-gray-50 cursor-pointer ml-4 text-black text-xs">
                                <input
                                  type="checkbox"
                                  checked={accessTags.includes(sub)}
                                  onChange={(e) => {
                                    if (e.target.checked) setAccessTags((prev) => [...prev, sub]);
                                    else setAccessTags((prev) => prev.filter((tag) => tag !== sub));
                                  }}
                                  className="accent-blue-600 rounded"
                                />
                                {sub}
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL{" "}
                  <span className="text-gray-400 font-normal">
                    (optional - paste a link)
                  </span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or Upload Image{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500"
                  accept="image/*"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Accommodation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Building2,
  ShoppingBag,
  Home,
  Loader2,
  X,
  UserCheck,
} from "lucide-react";

interface PaymentAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  type: string;
  createdAt: string;
}

export default function PaymentAccountsClient({
  initialAccounts,
}: {
  initialAccounts: PaymentAccount[];
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    type: "store",
  });

  const resetForm = () => {
    setFormData({
      accountName: "",
      accountNumber: "",
      bankName: "",
      type: "store",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (account: PaymentAccount) => {
    setFormData({
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      type: account.type,
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/payment-accounts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setAccounts((prev) =>
            prev.map((a) => (a.id === editingId ? { ...a, ...formData } : a)),
          );
          resetForm();
          router.refresh();
        } else {
          alert("Failed to update account");
        }
      } else {
        const res = await fetch("/api/admin/payment-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
          setAccounts((prev) => [
            ...prev,
            { id: result.id, ...formData, createdAt: new Date().toISOString() },
          ]);
          resetForm();
          router.refresh();
        } else {
          alert("Failed to create account: " + result.error);
        }
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment account?"))
      return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/payment-accounts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        router.refresh();
      } else {
        alert("Failed to delete account");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const registrationAccounts = accounts.filter((a) => a.type === "registration");
  const storeAccounts = accounts.filter((a) => a.type === "store");
  const accommodationAccounts = accounts.filter(
    (a) => a.type === "accommodation",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-6 h-6" /> Payment Accounts
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add Account
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Payment Account" : "Add Payment Account"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      accountName: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      accountNumber: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 0123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bankName: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. First Bank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="registration">Registration Payments</option>
                  <option value="store">Store Payments</option>
                  <option value="accommodation">Accommodation Payments</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Add Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <UserCheck size={18} className="text-purple-600" /> Registration Payment
          Accounts
        </h3>
        {registrationAccounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No registration payment account configured. Add one to receive
            registration payments.
          </div>
        ) : (
          <div className="space-y-3">
            {registrationAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-lg shadow p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {account.accountName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {account.bankName} — {account.accountNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(account)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    disabled={deletingId === account.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === account.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Store Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <ShoppingBag size={18} className="text-blue-600" /> Store Payment
          Accounts
        </h3>
        {storeAccounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No store payment account configured. Add one to receive store
            payments.
          </div>
        ) : (
          <div className="space-y-3">
            {storeAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-lg shadow p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {account.accountName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {account.bankName} — {account.accountNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(account)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    disabled={deletingId === account.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === account.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accommodation Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <Home size={18} className="text-green-600" /> Accommodation Payment
          Accounts
        </h3>
        {accommodationAccounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No accommodation payment account configured. Add one to receive
            accommodation payments.
          </div>
        ) : (
          <div className="space-y-3">
            {accommodationAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-lg shadow p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {account.accountName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {account.bankName} — {account.accountNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(account)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    disabled={deletingId === account.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === account.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

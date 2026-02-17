"use client";

import { useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirm = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to confirm registration for ${name}? This will send a confirmation email.`,
      )
    ) {
      return;
    }

    setConfirmingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        alert("User confirmed and email sent!");
        router.refresh();
      } else {
        alert("Error confirming user: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
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
                Status / Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
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
                  <div className="flex flex-col gap-2">
                    {user.registrationStatus === "Confirmed" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                        <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit">
                        Pending
                      </span>
                    )}

                    {user.registrationStatus !== "Confirmed" && (
                      <button
                        onClick={() =>
                          handleConfirm(user.uniqueId, user.fullName)
                        }
                        disabled={confirmingId === user.uniqueId}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {confirmingId === user.uniqueId ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        Confirm Payment
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

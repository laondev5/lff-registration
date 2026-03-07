import { getUsers } from "@/lib/registrationService";
import { getAccommodations } from "@/lib/accommodationService";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // We can fetch data directly on the server component
  const users = await getUsers();
  const accommodations = await getAccommodations();
  const confirmedCount = users.filter(
    (u) => u.registrationStatus === "Confirmed",
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 text-sm font-medium">
            Total Registrations
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {users.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 text-sm font-medium">
            Accommodations Listed
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {accommodations.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 text-sm font-medium">
            Confirmed Registrations
          </h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {confirmedCount}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Registrations
          </h2>
          <Link
            href="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.slice(0, 5).map((user) => (
                  <tr key={user.uniqueId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link
                        href={`/admin/users/${user.uniqueId}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {user.fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.registrationStatus === "Confirmed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.registrationStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(
                        parseInt(user.uniqueId?.split("-")[1] || "0"),
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No registrations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

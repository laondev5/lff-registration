import { getUsers } from "@/lib/registrationService";
import { getAccommodations } from "@/lib/accommodationService";
import { RegistrationChart } from "@/components/admin/RegistrationChart";

export const dynamic = "force-dynamic";

function buildChartData(users: { createdAt?: string; registrationStatus: string }[]) {
  const byDate: Record<string, { registrations: number; confirmed: number }> = {};

  for (const user of users) {
    if (!user.createdAt) continue;
    const date = new Date(user.createdAt).toISOString().split("T")[0];
    if (!byDate[date]) byDate[date] = { registrations: 0, confirmed: 0 };
    byDate[date].registrations++;
    if (user.registrationStatus === "Confirmed") byDate[date].confirmed++;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));
}

export default async function SubAdminDashboardPage() {
  const users = await getUsers();
  const accommodations = await getAccommodations();
  const confirmedCount = users.filter(
    (u) => u.registrationStatus === "Confirmed",
  ).length;
  const pendingCount = users.filter(
    (u) => u.registrationStatus !== "Confirmed",
  ).length;

  const chartData = buildChartData(users);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 text-sm font-medium">
            Total Registrations
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {users.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 text-sm font-medium">Confirmed</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {confirmedCount}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {pendingCount}
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
      </div>

      {/* Registrations Over Time Chart */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Registrations Over Time
        </h2>
        <RegistrationChart data={chartData} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Registrations
        </h2>
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
                {users.slice(0, 10).map((user) => (
                  <tr key={user.uniqueId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.fullName}
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
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
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

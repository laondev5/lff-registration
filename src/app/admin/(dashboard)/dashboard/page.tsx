import { getUsers, getAccommodations } from "@/lib/googleSheets";

export default async function DashboardPage() {
  // We can fetch data directly on the server component
  const users = await getUsers();
  const accommodations = await getAccommodations();

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
          <h3 className="text-gray-500 text-sm font-medium">Example Stat</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
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
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users
                  .slice(-5)
                  .reverse()
                  .map((user) => (
                    <tr key={user.uniqueId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
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
                      colSpan={3}
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

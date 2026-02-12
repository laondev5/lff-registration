import { getUsers } from '@/lib/googleSheets';

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Registered Users</h1>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    Total: {users.length}
                </span>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accommodation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Proof</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.uniqueId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            <a href={`/admin/users/${user.uniqueId}`} className="hover:text-primary hover:underline">
                                                {user.fullName}
                                            </a>
                                        </div>
                                        <div className="text-sm text-gray-500">{user.gender}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                        <div className="text-sm text-gray-500">WA: {user.whatsapp}</div>
                                        <div className="text-sm text-gray-500">Ph: {user.phoneNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.state}, {user.country}</div>
                                        <div className="text-sm text-gray-500">{user.churchDetails}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.attendanceType}</div>
                                        {user.isLFFMember === 'Yes' && (
                                            <span className="inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                LFF Member
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.needsAccommodation === 'Yes' ? 'Required' : 'No'}</div>
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
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

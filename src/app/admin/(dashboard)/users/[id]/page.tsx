import { getUserById } from '@/lib/googleSheets';
import Link from 'next/link';

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-2xl font-bold">User Not Found</h1>
                <Link href="/admin/users" className="text-blue-500 hover:underline mt-4 inline-block">Back to Users</Link>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">{user.fullName}</h1>
                <Link href="/admin/users" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
                    Back to List
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Personal Information */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Personal Information</h2>
                    <div className="space-y-3">
                        <DetailRow label="Full Name" value={user.fullName} />
                        <DetailRow label="Email" value={user.email} />
                        <DetailRow label="Phone Number" value={user.phoneNumber} />
                        <DetailRow label="WhatsApp" value={user.whatsapp} />
                        <DetailRow label="Gender" value={user.gender} />
                        <DetailRow label="Registration Date" value={new Date(user.timestamp).toLocaleString()} />
                    </div>
                </div>

                {/* Church & Location */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 text-purple-600 border-b pb-2">Church & Location</h2>
                    <div className="space-y-3">
                        <DetailRow label="LFF Member" value={user.isLFFMember} />
                        <DetailRow label="Church Details" value={user.churchDetails} />
                        <DetailRow label="Area/District" value={user.areaDistrict} />
                        <DetailRow label="State" value={user.state} />
                        <DetailRow label="Country" value={user.country} />
                    </div>
                </div>

                {/* Event Preferences */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 text-green-600 border-b pb-2">Event Preferences</h2>
                    <div className="space-y-3">
                        <DetailRow label="Attendance Type" value={user.attendanceType} />
                        <DetailRow label="Bus Interest" value={user.busInterest} />
                        <DetailRow label="Meal Collection" value={user.mealCollection} />
                        <div className="mt-4">
                            <span className="text-sm font-medium text-gray-500 block">Prayer Request</span>
                            <p className="text-gray-800 bg-gray-50 p-3 rounded-lg text-sm mt-1 border">
                                {user.prayerRequest || "None provided"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Accommodation & Payment */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 text-orange-600 border-b pb-2">Accommodation & Payment</h2>
                    <div className="space-y-3 mb-6">
                        <DetailRow label="Needs Accommodation" value={user.needsAccommodation} />
                        {user.needsAccommodation === 'Yes' && (
                            <>
                                <DetailRow label="Type" value={user.accommodationType} />
                                <DetailRow label="Price" value={user.price} />
                                <DetailRow label="Duration" value={user.duration} />
                            </>
                        )}
                    </div>
                    
                    <div>
                        <span className="text-sm font-medium text-gray-500 block mb-2">Payment Proof</span>
                        {user.paymentProof ? (
                             <div className="border rounded-lg overflow-hidden">
                                <iframe src={user.paymentProof.replace('/view', '/preview')} className="w-full h-64 border-0" title="Payment Proof" />
                                <div className="p-2 bg-gray-50 text-center border-t">
                                    <a href={user.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                                        Open Full Size
                                    </a>
                                </div>
                             </div>
                        ) : (
                            <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500 text-sm italic">
                                No proof uploaded yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Department Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-indigo-600 border-b pb-2">Department / Workforce</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="bg-indigo-50 p-4 rounded-lg">
                            <span className="text-sm font-medium text-gray-500 block">Status</span>
                            <span className="text-lg font-bold text-indigo-900">{user.departmentStatus || "Not Set"}</span>
                         </div>
                         <div className="bg-indigo-50 p-4 rounded-lg">
                            <span className="text-sm font-medium text-gray-500 block">Department</span>
                            <span className="text-lg font-bold text-indigo-900">{user.department || "N/A"}</span>
                         </div>
                         <div className="bg-indigo-50 p-4 rounded-lg">
                            <span className="text-sm font-medium text-gray-500 block">Sub-Department</span>
                            <span className="text-lg font-bold text-indigo-900">{user.subDepartment || "N/A"}</span>
                         </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string, value?: string }) {
    return (
        <div className="flex justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate" title={value}>{value || '-'}</span>
        </div>
    );
}

import { getUsers } from "@/lib/registrationService";
import SubAdminUsersTable from "./SubAdminUsersTable";

export const dynamic = "force-dynamic";

export default async function SubAdminUsersPage() {
  // @ts-ignore
  const users = await getUsers();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Registered Users</h1>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          Total: {users.length}
        </span>
      </div>

      <SubAdminUsersTable users={users} />
    </div>
  );
}

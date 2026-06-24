import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UsersTable from "@/components/dashboard/UsersTable";

export default async function UsersPage() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
        <p className="text-gray-500 text-sm">
          Customers browse only · Sellers get up to 10 products on their personal page · Admins get unlimited products on the home page.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}

export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Link from "next/link";

async function getStats(sellerId: string) {
  await connectDB();
  const [total, listed, draft] = await Promise.all([
    Product.countDocuments({ sellerId }),
    Product.countDocuments({ sellerId, status: "listed" }),
    Product.countDocuments({ sellerId, status: "draft" }),
  ]);
  return { total, listed, draft };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getStats(session!.user.id);

  const cards = [
    { label: "Total Products", value: stats.total },
    { label: "Live Listings", value: stats.listed },
    { label: "Drafts", value: stats.draft },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome back, {session!.user.name?.split(" ")[0]}
      </h1>
      <p className="text-gray-500 mb-8">Here&apos;s what&apos;s happening with your store.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {cards.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard/products/new"
          className="px-5 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
        >
          + New product
        </Link>
        <Link
          href="/dashboard/products"
          className="px-5 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          View all products
        </Link>
      </div>
    </div>
  );
}

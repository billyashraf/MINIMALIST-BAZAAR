import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import Link from "next/link";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export default async function SellersPage() {
  await connectDB();

  // Find all users who have at least one listed product
  const listedProducts = await Product.find({ status: "listed" })
    .select("sellerId")
    .lean();

  const sellerIdSet = new Set(listedProducts.map((p) => p.sellerId.toString()));
  const sellerIds = [...sellerIdSet].map((id) => new mongoose.Types.ObjectId(id));

  const sellers = await User.find({ _id: { $in: sellerIds } })
    .select("-password")
    .lean();

  // Count listed products per seller
  const countDocs = await Product.aggregate([
    { $match: { status: "listed", sellerId: { $in: sellerIds } } },
    { $group: { _id: "$sellerId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(countDocs.map((d) => [d._id.toString(), d.count as number]));

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sellers</h1>
        <p className="text-gray-700 mb-10">Browse individual seller bazaars.</p>

        {sellers.length === 0 ? (
          <p className="text-gray-700 text-center py-20">No sellers yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sellers.map((seller) => {
              const id = seller._id.toString();
              const productCount = countMap.get(id) ?? 0;
              const isAdmin = seller.role === "admin";
              const isSeller = seller.role === "seller";

              return (
                <Link
                  key={id}
                  href={`/sellers/${id}`}
                  className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow group"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {seller.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 truncate">{seller.name}</p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          isAdmin
                            ? "bg-black text-white"
                            : isSeller
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isAdmin ? "Admin" : isSeller ? "Seller" : "User"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {productCount} listing{productCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <span className="text-gray-400 group-hover:text-gray-700 transition-colors text-lg">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const seller = await User.findById(id).select("-password").lean();
  if (!seller) return {};
  return {
    title: `${seller.name}'s Bazaar`,
    description: `Browse ${seller.name}'s curated product listings.`,
  };
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();

  const seller = await User.findById(id).select("-password").lean();
  if (!seller) notFound();

  const products = await Product.find({ sellerId: id, status: "listed" })
    .sort({ createdAt: -1 })
    .lean();

  const isAdmin = seller.role === "admin";
  const isSeller = seller.role === "seller";

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Seller header */}
        <div className="flex items-center gap-5 mb-12 pb-8 border-b border-gray-200">
          <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {seller.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{seller.name}&apos;s Bazaar</h1>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  isAdmin
                    ? "bg-black text-white"
                    : isSeller
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {isAdmin ? "Admin" : isSeller ? "Seller" : "User"}
              </span>
            </div>
            <p className="text-gray-700 text-sm">
              {products.length} listing{products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Link href="/sellers" className="text-sm text-gray-700 hover:text-gray-900 mb-8 inline-block">
          ← All sellers
        </Link>

        {products.length === 0 ? (
          <p className="text-gray-700 text-center py-20">No listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {products.map((p) => (
              <Link
                key={String(p._id)}
                href={`/products/${p._id}`}
                className="group rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-gray-50">
                  {p.images[0] && (
                    <Image
                      src={p.images[0]}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-medium text-gray-900 mb-1 line-clamp-1">{p.title}</h2>
                  <p className="text-gray-700 text-sm line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">${p.salePrice.toFixed(2)}</span>
                    {p.deliveryEstimate && (
                      <span className="text-xs text-gray-700">{p.deliveryEstimate}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

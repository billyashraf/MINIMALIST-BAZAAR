import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Image from "next/image";
import Link from "next/link";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  await connectDB();
  const products = await Product.find({ status: "listed" })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop</h1>
        <p className="text-gray-700 mb-10">Curated essentials, simply priced.</p>

        {products.length === 0 ? (
          <p className="text-gray-700 text-center py-20">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

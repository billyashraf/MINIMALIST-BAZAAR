import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Image from "next/image";
import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import CartDrawer from "@/components/cart/CartDrawer";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  await connectDB();
  const products = await Product.find({ status: "listed" })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-white sticky top-0 z-30">
        <span className="text-lg font-bold tracking-tight">Minimalist Bazaar</span>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/orders"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5"
              >
                My orders
              </Link>
              {(session.user as { role?: string }).role === "admin" && (
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5"
                >
                  Dashboard
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Register
              </Link>
            </>
          )}
          <CartButton />
        </div>
      </header>
      <CartDrawer />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-3">
            Minimalist Bazaar
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Curate products. Set your price. Start selling.
          </p>
          {!session?.user && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="px-6 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop</h2>
          <p className="text-gray-400">Curated essentials, simply priced.</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <Link
                key={String(p._id)}
                href={`/products/${p._id}`}
                className="group rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
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
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{p.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">${p.salePrice.toFixed(2)}</span>
                    {p.deliveryEstimate && (
                      <span className="text-xs text-gray-400">{p.deliveryEstimate}</span>
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

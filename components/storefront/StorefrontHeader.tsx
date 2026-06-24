import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import CartDrawer from "@/components/cart/CartDrawer";
import SignOutButton from "@/components/storefront/SignOutButton";
import { auth } from "@/auth";

export default async function StorefrontHeader() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <>
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white sticky top-0 z-30">
        <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">
          Minimalist Bazaar
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/sellers" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
            Sellers
          </Link>
          {session?.user ? (
            <>
              <Link href="/orders" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                My orders
              </Link>
              {role === "admin" && (
                <Link href="/dashboard" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="text-sm px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors">
                Register
              </Link>
            </>
          )}
          <CartButton />
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

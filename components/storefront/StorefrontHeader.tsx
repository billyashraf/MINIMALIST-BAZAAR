import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import CartDrawer from "@/components/cart/CartDrawer";
import { auth } from "@/auth";

export default async function StorefrontHeader() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <>
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-white sticky top-0 z-30">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Minimalist Bazaar
        </Link>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/orders"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5"
              >
                My orders
              </Link>
              {role === "admin" && (
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5"
                >
                  Dashboard
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
          )}
          <CartButton />
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

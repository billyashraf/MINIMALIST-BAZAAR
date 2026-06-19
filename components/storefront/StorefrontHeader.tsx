import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import CartDrawer from "@/components/cart/CartDrawer";

export default function StorefrontHeader() {
  return (
    <>
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-white">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Minimalist Bazaar
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <CartButton />
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

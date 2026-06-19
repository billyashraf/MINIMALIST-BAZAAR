import Link from "next/link";
import DemoAccessButton from "@/components/DemoAccessButton";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-3">
          Minimalist Bazaar
        </h1>
        <p className="text-gray-400 text-lg">
          Curate products. Set your price. Start selling.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
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
        <DemoAccessButton />
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-400">
        <Link href="/products" className="hover:text-gray-900 transition-colors">
          Browse shop
        </Link>
        <span className="w-px h-4 bg-gray-200" />
        <span>No credit card required for demo</span>
      </div>
    </main>
  );
}

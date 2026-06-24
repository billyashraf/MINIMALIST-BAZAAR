import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-8xl font-bold text-gray-100 select-none mb-6">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-600 text-sm mb-8 max-w-xs">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/products"
          className="px-5 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
        >
          Browse products
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

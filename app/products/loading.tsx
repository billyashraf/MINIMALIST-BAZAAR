export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="h-6 w-36 bg-gray-100 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-gray-100 rounded-xl" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-1/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

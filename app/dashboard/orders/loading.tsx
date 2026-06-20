export default function OrdersLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-24 bg-gray-100 rounded mb-6" />
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-gray-100 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
            <div className="h-8 w-24 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

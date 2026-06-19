import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-yellow-50 text-yellow-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-gray-100 text-gray-500",
};

const fulfillmentColors: Record<string, string> = {
  unfulfilled: "bg-yellow-50 text-yellow-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const raw = await Order.find({ customerId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const orders = JSON.parse(JSON.stringify(raw));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">Minimalist Bazaar</Link>
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900">Shop</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400 mb-4">No orders yet</p>
            <Link href="/products" className="text-sm font-medium text-black underline underline-offset-2">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: {
              _id: string;
              createdAt: string;
              items: { title: string; quantity: number; price: number }[];
              totalAmount: number;
              paymentStatus: string;
              fulfillmentStatus: string;
              trackingNumber?: string;
              carrier?: string;
            }) => (
              <div key={order._id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                    <p className="font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusColors[order.paymentStatus] ?? ""}`}>
                      {order.paymentStatus}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${fulfillmentColors[order.fulfillmentStatus] ?? ""}`}>
                      {order.fulfillmentStatus}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-sm text-gray-500 line-clamp-1">
                      {item.title} × {item.quantity}
                    </p>
                  ))}
                </div>
                {order.trackingNumber && (
                  <p className="text-xs text-gray-400 mt-2">
                    {order.carrier} · {order.trackingNumber}
                  </p>
                )}
                <Link
                  href={`/orders/${order._id}`}
                  className="inline-block mt-2 text-xs text-black underline underline-offset-2"
                >
                  View details
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

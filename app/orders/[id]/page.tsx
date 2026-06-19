import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusSteps = ["unfulfilled", "processing", "shipped", "delivered"] as const;

const stepLabel: Record<string, string> = {
  unfulfilled: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  await connectDB();

  const raw = await Order.findOne({ _id: id, customerId: session.user.id }).lean();
  if (!raw) notFound();

  const order = JSON.parse(JSON.stringify(raw));
  const currentStep = statusSteps.indexOf(order.fulfillmentStatus as typeof statusSteps[number]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">Minimalist Bazaar</Link>
        <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-900">← My orders</Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order details</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Placed {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="text-lg font-bold">${order.totalAmount.toFixed(2)}</span>
        </div>

        {/* Progress tracker */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                  i <= currentStep ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {i < currentStep ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <p className={`text-xs text-center ${i <= currentStep ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                  {stepLabel[step]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking */}
        {order.trackingNumber && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">Tracking</p>
            <p className="text-sm text-gray-600">
              {order.carrier} · <span className="font-mono">{order.trackingNumber}</span>
            </p>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-black underline underline-offset-2"
              >
                Track package →
              </a>
            )}
            {order.shippedAt && (
              <p className="text-xs text-gray-400 mt-2">
                Shipped {new Date(order.shippedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {order.items.map((item: { title: string; quantity: number; price: number }, i: number) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-400">× {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-2">Shipping address</p>
          <p className="text-sm text-gray-600">{order.shippingAddress.fullName}</p>
          <p className="text-sm text-gray-600">{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 && <p className="text-sm text-gray-600">{order.shippingAddress.line2}</p>}
          <p className="text-sm text-gray-600">
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
          <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
        </div>
      </main>
    </div>
  );
}

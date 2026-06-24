import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import FulfillButton from "@/components/dashboard/FulfillButton";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  unfulfilled: "bg-yellow-50 text-yellow-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default async function SellerOrdersPage() {
  const session = await auth();
  await connectDB();

  const sellerProducts = await Product.find({ sellerId: session!.user.id }).select("_id").lean();
  const productIds = sellerProducts.map((p) => p._id);

  const raw = await Order.find({ "items.productId": { $in: productIds } })
    .sort({ createdAt: -1 })
    .lean();

  const orders = JSON.parse(JSON.stringify(raw));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-600 text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tracking</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order: {
                _id: string;
                createdAt: string;
                shippingAddress: { fullName: string; city: string; country: string };
                items: { title: string; quantity: number }[];
                totalAmount: number;
                fulfillmentStatus: string;
                trackingNumber?: string;
                carrier?: string;
                trackingUrl?: string;
              }) => (
                <tr key={order._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-xs">{order.shippingAddress.fullName}</p>
                    <p className="text-gray-600 text-xs">{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                  </td>
                  <td className="px-4 py-3">
                    {order.items.map((i, idx) => (
                      <p key={idx} className="text-xs text-gray-600 line-clamp-1">
                        {i.title} × {i.quantity}
                      </p>
                    ))}
                  </td>
                  <td className="px-4 py-3 font-medium text-xs">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[order.fulfillmentStatus] ?? ""}`}>
                      {order.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {order.trackingNumber ? (
                      order.trackingUrl ? (
                        <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-2">
                          {order.carrier} {order.trackingNumber}
                        </a>
                      ) : (
                        <span>{order.carrier} {order.trackingNumber}</span>
                      )
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <FulfillButton orderId={order._id} currentStatus={order.fulfillmentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

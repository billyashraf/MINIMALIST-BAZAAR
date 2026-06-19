import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

const fulfillmentColors: Record<string, string> = {
  unfulfilled: "bg-yellow-50 text-yellow-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default async function SellerOrdersPage() {
  const session = await auth();

  await connectDB();

  // Find all products owned by this seller
  const sellerProducts = await Product.find({ sellerId: session!.user.id }).select("_id").lean();
  const productIds = sellerProducts.map((p) => p._id);

  // Find orders containing those products
  const raw = await Order.find({ "items.productId": { $in: productIds } })
    .sort({ createdAt: -1 })
    .lean();

  const orders = JSON.parse(JSON.stringify(raw));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order: {
                _id: string;
                createdAt: string;
                items: { title: string; quantity: number }[];
                totalAmount: number;
                paymentStatus: string;
                fulfillmentStatus: string;
              }) => (
                <tr key={order._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {order.items.map((i, idx) => (
                      <span key={idx} className="block text-gray-700 line-clamp-1">
                        {i.title} × {i.quantity}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 font-medium">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium capitalize bg-green-50 text-green-700">
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${fulfillmentColors[order.fulfillmentStatus] ?? ""}`}>
                      {order.fulfillmentStatus}
                    </span>
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

export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import AffiliateLink from "@/models/AffiliateLink";
import Link from "next/link";

const fulfillmentColors: Record<string, string> = {
  unfulfilled: "bg-yellow-50 text-yellow-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
};

export default async function DashboardPage() {
  const session = await auth();
  const sellerId = session!.user.id;

  await connectDB();

  const [total, listed, draft, affiliateLinks, sellerProducts] = await Promise.all([
    Product.countDocuments({ sellerId }),
    Product.countDocuments({ sellerId, status: "listed" }),
    Product.countDocuments({ sellerId, status: "draft" }),
    AffiliateLink.find({ sellerId }).lean(),
    Product.find({ sellerId }).select("_id").lean(),
  ]);

  const productIds = sellerProducts.map((p) => p._id);
  const recentOrders = await Order.find({ "items.productId": { $in: productIds } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const allOrders = await Order.find({ "items.productId": { $in: productIds } })
    .select("totalAmount fulfillmentStatus")
    .lean();

  const totalRevenue = allOrders.reduce((s, o) => s + o.totalAmount, 0);
  const pendingOrders = allOrders.filter((o) => o.fulfillmentStatus === "unfulfilled").length;
  const totalClicks = affiliateLinks.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = affiliateLinks.reduce((s, l) => s + l.conversions, 0);

  const statCards = [
    { label: "Live Listings", value: listed, sub: `${draft} draft${draft !== 1 ? "s" : ""}` },
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, sub: `${allOrders.length} orders` },
    { label: "Pending Orders", value: pendingOrders, sub: "awaiting fulfillment" },
    { label: "Affiliate Clicks", value: totalClicks, sub: `${totalConversions} conversions` },
    { label: "Total Products", value: total, sub: "in your catalog" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, {session!.user.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500 text-sm">Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/products/new"
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
        >
          + New product
        </Link>
        <Link
          href="/dashboard/products/import"
          className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          ↓ Import URL
        </Link>
        <Link
          href="/dashboard/orders"
          className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          View orders
        </Link>
        <Link
          href="/dashboard/analytics"
          className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Analytics
        </Link>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-xs text-gray-600 hover:text-gray-700">
              View all →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {recentOrders.map((order) => {
              const o = order as unknown as {
                _id: string;
                createdAt: Date;
                shippingAddress: { fullName: string };
                totalAmount: number;
                fulfillmentStatus: string;
                items: { title: string }[];
              };
              return (
                <div key={String(o._id)} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{o.shippingAddress.fullName}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {o.items.map((i) => i.title).join(", ")}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 shrink-0">${o.totalAmount.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${fulfillmentColors[o.fulfillmentStatus] ?? "bg-gray-100 text-gray-500"}`}>
                    {o.fulfillmentStatus}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recentOrders.length === 0 && (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-600 text-sm">No orders yet — share your affiliate links to start selling.</p>
        </div>
      )}
    </div>
  );
}

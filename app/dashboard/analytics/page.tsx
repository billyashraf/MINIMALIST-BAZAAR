import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import AffiliateLink from "@/models/AffiliateLink";
import Product from "@/models/Product";
import CopyButton from "@/components/dashboard/CopyButton";
import CreateAffiliateLinkButton from "@/components/dashboard/CreateAffiliateLinkButton";
import DeleteAffiliateLinkButton from "@/components/dashboard/DeleteAffiliateLinkButton";

export const dynamic = "force-dynamic";

interface PopulatedProduct {
  _id: string;
  title: string;
  salePrice: number;
}

interface AffLink {
  _id: string;
  slug: string;
  clicks: number;
  conversions: number;
  productId: PopulatedProduct;
}

export default async function AnalyticsPage() {
  const session = await auth();
  await connectDB();

  const rawLinks = await AffiliateLink.find({ sellerId: session!.user.id })
    .populate("productId", "title salePrice")
    .sort({ clicks: -1 })
    .lean();

  const links: AffLink[] = JSON.parse(JSON.stringify(rawLinks));

  const rawProducts = await Product.find({ sellerId: session!.user.id, status: "listed" })
    .select("_id title")
    .lean();
  const products: { _id: string; title: string }[] = JSON.parse(JSON.stringify(rawProducts));

  const linkedProductIds = new Set(links.map((l) => l.productId?._id?.toString()));
  const unlinkedProducts = products.filter((p) => !linkedProductIds.has(p._id.toString()));

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
  const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : "0";

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Track link performance and manage shareable URLs</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total links</p>
          <p className="text-3xl font-bold text-gray-900">{links.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total clicks</p>
          <p className="text-3xl font-bold text-gray-900">{totalClicks}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Conversions</p>
          <p className="text-3xl font-bold text-gray-900">{totalConversions}</p>
          <p className="text-xs text-gray-400 mt-1">{convRate}% rate</p>
        </div>
      </div>

      {/* Affiliate links table */}
      {links.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your affiliate links</h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Share URL</th>
                  <th className="px-4 py-3 font-medium text-right">Clicks</th>
                  <th className="px-4 py-3 font-medium text-right">Conv.</th>
                  <th className="px-4 py-3 font-medium text-right">Rate</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {links.map((link) => {
                  const rate =
                    link.clicks > 0
                      ? ((link.conversions / link.clicks) * 100).toFixed(1)
                      : "0";
                  const shareUrl = `${baseUrl}/go/${link.slug}`;

                  return (
                    <tr key={link._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1 text-xs max-w-[160px]">
                          {link.productId?.title ?? "(deleted product)"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono truncate max-w-[150px]">
                            /go/{link.slug}
                          </span>
                          <CopyButton text={shareUrl} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium">{link.clicks}</td>
                      <td className="px-4 py-3 text-right text-xs font-medium">{link.conversions}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-black rounded-full"
                              style={{ width: `${Math.min(Number(rate), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeleteAffiliateLinkButton linkId={link._id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products without affiliate links */}
      {unlinkedProducts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Create affiliate links</h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {unlinkedProducts.map((product) => (
              <div key={product._id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-gray-700 line-clamp-1 flex-1">{product.title}</p>
                <CreateAffiliateLinkButton productId={product._id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {links.length === 0 && unlinkedProducts.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No listed products yet.</p>
          <p className="text-gray-300 text-xs mt-1">
            List a product first, then create an affiliate link for it.
          </p>
        </div>
      )}
    </div>
  );
}

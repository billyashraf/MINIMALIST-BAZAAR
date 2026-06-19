import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Link from "next/link";
import ProductRow from "@/components/products/ProductRow";

interface SerializedProduct {
  _id: string;
  title: string;
  images: string[];
  sourcePrice: number;
  salePrice: number;
  status: string;
}

export default async function ProductsPage() {
  const session = await auth();
  await connectDB();
  const raw = await Product.find({ sellerId: session!.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const products = JSON.parse(JSON.stringify(raw)) as SerializedProduct[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/products/import"
            className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            ↓ Import URL
          </Link>
          <Link
            href="/dashboard/products/new"
            className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
          >
            + New product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 mb-4">No products yet</p>
          <Link
            href="/dashboard/products/new"
            className="text-sm font-medium text-black underline underline-offset-2"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Source price</th>
                <th className="px-4 py-3 font-medium">Sale price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <ProductRow key={String(p._id)} product={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

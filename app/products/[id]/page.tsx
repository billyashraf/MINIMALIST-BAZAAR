import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const product = await Product.findOne({ _id: id, status: "listed" }).lean();
  if (!product) notFound();

  const margin = (
    ((product.salePrice - product.sourcePrice) / product.sourcePrice) *
    100
  ).toFixed(0);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to shop
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{product.description}</p>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              ${product.salePrice.toFixed(2)}
            </span>
          </div>

          {product.deliveryEstimate && (
            <p className="text-sm text-gray-400 mb-6">
              Delivery: {product.deliveryEstimate}
            </p>
          )}

          <a
            href={product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-black text-white text-center rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Buy now
          </a>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Sold via {product.sourceStore}
          </p>
        </div>
      </main>
    </div>
  );
}

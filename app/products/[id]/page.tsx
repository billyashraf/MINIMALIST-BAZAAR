import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import AddToCartButton from "@/components/cart/AddToCartButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const product = await Product.findOne({ _id: id, status: "listed" }).lean();
  if (!product) return {};

  return {
    title: product.title,
    description: product.description?.slice(0, 160) || product.title,
    openGraph: {
      title: product.title,
      description: product.description?.slice(0, 160) || product.title,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const product = await Product.findOne({ _id: id, status: "listed" }).lean();
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />

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
          <Link href="/products" className="text-sm text-gray-700 hover:text-gray-900 mb-4 inline-block">
            ← Back to shop
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>
          <p className="text-gray-700 text-sm mb-6 leading-relaxed">{product.description}</p>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              ${product.salePrice.toFixed(2)}
            </span>
          </div>

          {product.deliveryEstimate && (
            <p className="text-sm text-gray-700 mb-6">Delivery: {product.deliveryEstimate}</p>
          )}

          <AddToCartButton
            productId={String(product._id)}
            title={product.title}
            image={product.images[0] ?? ""}
            price={product.salePrice}
          />

          <p className="mt-4 text-xs text-gray-700 text-center">
            Sold via {product.sourceStore}
          </p>
        </div>
      </main>
    </div>
  );
}

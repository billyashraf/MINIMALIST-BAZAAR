import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import ProductForm from "@/components/products/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  await connectDB();
  const raw = await Product.findOne({ _id: id, sellerId: session!.user.id }).lean();
  if (!raw) notFound();
  const product = JSON.parse(JSON.stringify(raw));

  const defaultValues = {
    title: product.title,
    description: product.description,
    images: product.images.map((url: string) => ({ url })),
    sourceStore: product.sourceStore,
    sourceUrl: product.sourceUrl,
    sourcePrice: product.sourcePrice,
    salePrice: product.salePrice,
    deliveryEstimate: product.deliveryEstimate,
    status: product.status as "draft" | "listed" | "disabled",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit product</h1>
      <ProductForm productId={id} defaultValues={defaultValues} />
    </div>
  );
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { z } from "zod";

const PRODUCT_LIMIT = 10;

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  images: z.array(z.string().url()).min(1),
  sourceStore: z.string().min(1),
  sourceUrl: z.string().url(),
  sourcePrice: z.number().min(0),
  salePrice: z.number().min(0),
  deliveryEstimate: z.string().optional(),
  status: z.enum(["draft", "listed", "disabled"]).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const sellerId = searchParams.get("sellerId");

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (sellerId) filter.sellerId = sellerId;

  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await connectDB();

  const role = (session.user as { role?: string }).role;

  // Only sellers and admins can list products
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "You need to be a seller to list products. Contact admin to be promoted." },
      { status: 403 }
    );
  }

  // Sellers are capped at 10 products
  if (role === "seller") {
    const count = await Product.countDocuments({ sellerId: session.user.id });
    if (count >= PRODUCT_LIMIT) {
      return NextResponse.json(
        { error: `You have reached the ${PRODUCT_LIMIT}-product limit. Contact admin to be promoted to admin for unlimited listings.` },
        { status: 403 }
      );
    }
  }

  const product = await Product.create({ ...parsed.data, sellerId: session.user.id });
  return NextResponse.json(product, { status: 201 });
}

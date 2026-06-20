import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import AffiliateLink from "@/models/AffiliateLink";
import Product from "@/models/Product";
import { randomBytes } from "crypto";
import { z } from "zod";

function generateSlug(): string {
  return randomBytes(5).toString("base64url").substring(0, 7);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const links = await AffiliateLink.find({ sellerId: session.user.id })
    .populate("productId", "title images salePrice sourcePrice status")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(JSON.parse(JSON.stringify(links)));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = z.object({ productId: z.string() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await connectDB();

  // Verify seller owns the product
  const product = await Product.findOne({ _id: parsed.data.productId, sellerId: session.user.id });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Check if link already exists for this product+seller
  const existing = await AffiliateLink.findOne({
    productId: parsed.data.productId,
    sellerId: session.user.id,
  });
  if (existing) return NextResponse.json(JSON.parse(JSON.stringify(existing)));

  // Generate unique slug
  let slug = generateSlug();
  while (await AffiliateLink.exists({ slug })) {
    slug = generateSlug();
  }

  const link = await AffiliateLink.create({
    productId: parsed.data.productId,
    sellerId: session.user.id,
    slug,
  });

  return NextResponse.json(JSON.parse(JSON.stringify(link)), { status: 201 });
}

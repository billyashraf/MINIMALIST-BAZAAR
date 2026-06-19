import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const email = process.env.DEMO_SELLER_EMAIL ?? "demo@minimalistbazaar.com";
  const password = process.env.DEMO_SELLER_PASSWORD ?? "demo123456";

  await connectDB();

  let user = await User.findOne({ email });
  if (!user) {
    const hashed = await bcryptjs.hash(password, 12);
    user = await User.create({ name: "Demo Seller", email, password: hashed, role: "seller" });
  }

  const existing = await Product.countDocuments({ sellerId: user._id });
  if (existing === 0) {
    await Product.insertMany([
      {
        sellerId: user._id,
        title: "Minimal Leather Wallet",
        description: "Slim bifold wallet crafted from full-grain leather. Holds up to 6 cards and cash. Ages beautifully with use.",
        images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=600"],
        sourceStore: "Demo Store",
        sourceUrl: "https://example.com/wallet",
        sourcePrice: 19.99,
        salePrice: 34.99,
        deliveryEstimate: "3–5 business days",
        status: "listed",
      },
      {
        sellerId: user._id,
        title: "Ceramic Pour-Over Coffee Set",
        description: "Handmade ceramic dripper with matching server. Brews a clean, nuanced cup. Dishwasher safe.",
        images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"],
        sourceStore: "Demo Store",
        sourceUrl: "https://example.com/coffee",
        sourcePrice: 28.00,
        salePrice: 49.00,
        deliveryEstimate: "5–7 business days",
        status: "listed",
      },
      {
        sellerId: user._id,
        title: "Linen Throw Blanket",
        description: "Stone-washed linen blend blanket, 130×170 cm. Lightweight, breathable, and gets softer every wash.",
        images: ["https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600"],
        sourceStore: "Demo Store",
        sourceUrl: "https://example.com/blanket",
        sourcePrice: 35.00,
        salePrice: 65.00,
        deliveryEstimate: "4–6 business days",
        status: "draft",
      },
    ]);
  }

  return NextResponse.json({ ok: true });
}

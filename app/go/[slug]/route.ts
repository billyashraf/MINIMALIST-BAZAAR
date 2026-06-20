import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AffiliateLink from "@/models/AffiliateLink";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await connectDB();

  const link = await AffiliateLink.findOneAndUpdate(
    { slug },
    { $inc: { clicks: 1 } },
    { new: false }
  );

  if (!link) {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  const response = NextResponse.redirect(
    new URL(`/products/${link.productId}`, request.url)
  );

  // 30-day attribution cookie
  response.cookies.set("aff", slug, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

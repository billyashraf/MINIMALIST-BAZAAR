import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { routeSupplierOrder } from "@/services/dropshipping";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const productIds = order.items.map((i) => i.productId);
  const owned = await Product.exists({
    _id: { $in: productIds },
    sellerId: session.user.id,
  });

  if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await routeSupplierOrder(id);

  return NextResponse.json({ ok: true });
}

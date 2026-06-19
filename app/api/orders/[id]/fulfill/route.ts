import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { updateFulfillment } from "@/services/fulfillment";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  trackingUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  await connectDB();

  // Verify the order contains at least one product owned by this seller
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const productIds = order.items.map((i) => i.productId);
  const owned = await Product.exists({
    _id: { $in: productIds },
    sellerId: session.user.id,
  });

  if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await updateFulfillment(id, {
    status: parsed.data.status,
    trackingNumber: parsed.data.trackingNumber,
    carrier: parsed.data.carrier,
    trackingUrl: parsed.data.trackingUrl || undefined,
  });

  return NextResponse.json({ ok: true });
}

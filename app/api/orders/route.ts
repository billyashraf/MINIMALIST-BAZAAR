import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const orders = await Order.find({ customerId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(JSON.parse(JSON.stringify(orders)));
}

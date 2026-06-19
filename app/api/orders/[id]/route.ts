import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const order = await Order.findOne({ _id: id, customerId: session.user.id }).lean();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(JSON.parse(JSON.stringify(order)));
}

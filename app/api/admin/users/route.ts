import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();
  const users = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();

  const userIds = users.map((u) => u._id as mongoose.Types.ObjectId);
  const orderCounts = await Order.aggregate([
    { $match: { customerId: { $in: userIds }, paymentStatus: "paid" } },
    { $group: { _id: "$customerId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(orderCounts.map((o) => [o._id.toString(), o.count as number]));

  const result = users.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    maxOrders: u.maxOrders,
    orderCount: countMap.get(u._id.toString()) ?? 0,
    createdAt: u.createdAt,
  }));

  return NextResponse.json(result);
}

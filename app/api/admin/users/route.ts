import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
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
  const productCounts = await Product.aggregate([
    { $match: { sellerId: { $in: userIds } } },
    { $group: { _id: "$sellerId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(productCounts.map((p) => [p._id.toString(), p.count as number]));

  const result = users.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    blocked: u.blocked ?? false,
    productCount: countMap.get(u._id.toString()) ?? 0,
    createdAt: u.createdAt,
  }));

  return NextResponse.json(result);
}

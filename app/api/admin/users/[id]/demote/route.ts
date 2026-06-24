import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const stepDown: Record<string, string> = {
  admin: "seller",
  seller: "customer",
};

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot demote yourself" }, { status: 400 });
  }

  await connectDB();

  const target = await User.findById(id).select("role");
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const nextRole = stepDown[target.role];
  if (!nextRole) {
    return NextResponse.json({ error: "User is already at the lowest role" }, { status: 400 });
  }

  const updated = await User.findByIdAndUpdate(id, { role: nextRole }, { new: true }).select("-password");

  return NextResponse.json({ id: updated!._id.toString(), role: updated!.role });
}

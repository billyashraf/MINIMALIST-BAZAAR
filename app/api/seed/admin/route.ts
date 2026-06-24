import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  await connectDB();

  const email = "admin@minimalistbazaar.com";
  const existing = await User.findOne({ email });

  if (existing) {
    return NextResponse.json({ message: "Admin account already exists", email }, { status: 200 });
  }

  const hashed = await bcryptjs.hash("Admin@Bazaar2024!", 12);
  await User.create({
    name: "Admin",
    email,
    password: hashed,
    role: "admin",
    maxOrders: -1,
  });

  return NextResponse.json({ ok: true, email, password: "Admin@Bazaar2024!" }, { status: 201 });
}

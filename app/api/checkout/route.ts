import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/payments";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

const cartItemSchema = z.object({
  productId: z.string(),
  title: z.string(),
  image: z.string(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
});

const schema = z.object({
  items: z.array(cartItemSchema).min(1),
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const session = await auth();
  const body = await request.json();
  const parsed = schema.safeParse(body);

  // Enforce order limit for logged-in users
  if (session?.user?.id) {
    await connectDB();
    const user = await User.findById(session.user.id).select("maxOrders");
    if (user && user.maxOrders !== -1) {
      const orderCount = await Order.countDocuments({
        customerId: session.user.id,
        paymentStatus: "paid",
      });
      if (orderCount >= user.maxOrders) {
        return NextResponse.json(
          {
            error: `You have reached your order limit of ${user.maxOrders}. Contact admin to be promoted to unlimited orders.`,
          },
          { status: 403 }
        );
      }
    }
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
  }

  const { items } = parsed.data;
  const stripe = getStripe();
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          ...(item.image ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU", "FR", "DE", "MA"],
    },
    metadata: {
      customerId: session?.user?.id ?? "guest",
      affiliateSlug: (await cookies()).get("aff")?.value ?? "",
      items: JSON.stringify(
        items.map((i) => ({
          productId: i.productId,
          title: i.title,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
        }))
      ),
    },
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}

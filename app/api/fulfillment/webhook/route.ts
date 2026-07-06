import { NextResponse } from "next/server";
import { getStripe } from "@/lib/payments";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AffiliateLink from "@/models/AffiliateLink";
import { routeSupplierOrder } from "@/services/dropshipping";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    // Cast to access shipping_details (available in Stripe API 2024+)
    const session = event.data.object as Stripe.Checkout.Session & {
      shipping_details?: {
        name?: string;
        address?: {
          line1?: string;
          line2?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
        };
      };
    };

    const items = JSON.parse(session.metadata?.items ?? "[]");
    const customerId = session.metadata?.customerId;
    const affiliateSlug = session.metadata?.affiliateSlug;
    const addr = session.shipping_details?.address;

    if (!addr) return NextResponse.json({ ok: true });

    await connectDB();
    const order = await Order.create({
      ...(customerId && customerId !== "guest" ? { customerId } : {}),
      items,
      totalAmount: (session.amount_total ?? 0) / 100,
      paymentStatus: "paid",
      fulfillmentStatus: "unfulfilled",
      customerEmail: session.customer_details?.email ?? "",
      shippingAddress: {
        fullName: session.shipping_details?.name ?? "",
        line1: addr.line1 ?? "",
        line2: addr.line2 ?? "",
        city: addr.city ?? "",
        state: addr.state ?? "",
        postalCode: addr.postal_code ?? "",
        country: addr.country ?? "",
      },
      stripePaymentIntentId: session.payment_intent as string,
    });

    // Track affiliate conversion
    if (affiliateSlug) {
      await AffiliateLink.findOneAndUpdate(
        { slug: affiliateSlug },
        { $inc: { conversions: 1 } }
      );
    }

    // Attempt to auto-place the supplier order for each item; anything that can't be
    // automated (unsupported source, no purchasing card connected, provider failure)
    // falls back to a manual_required task in the seller dashboard — this must never
    // block or fail the payment webhook itself.
    try {
      await routeSupplierOrder(String(order._id));
    } catch (e) {
      console.error("Supplier order routing failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}

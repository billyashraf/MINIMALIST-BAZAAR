import { redirect } from "next/navigation";
import { getStripe } from "@/lib/payments";
import ClearCart from "@/components/cart/ClearCart";
import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/");

  let customerName = "";
  let total = 0;
  let itemCount = 0;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") redirect("/checkout");

    const s = session as typeof session & { shipping_details?: { name?: string } };
    customerName = s.shipping_details?.name ?? "";
    total = (session.amount_total ?? 0) / 100;
    itemCount = session.line_items?.data.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0;
  } catch {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <ClearCart />
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order confirmed!</h1>
        {customerName && (
          <p className="text-gray-500 mb-1">Thank you, {customerName.split(" ")[0]}.</p>
        )}
        <p className="text-gray-400 text-sm mb-8">
          {itemCount} item{itemCount !== 1 ? "s" : ""} · ${total.toFixed(2)} paid
        </p>

        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 text-left text-sm text-gray-500 space-y-1">
          <p>✓ Payment received</p>
          <p>✓ Order is being prepared for fulfillment</p>
          <p className="text-gray-400">You will receive a confirmation email shortly.</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href="/products"
            className="px-6 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
          >
            Continue shopping
          </Link>
          <Link
            href="/orders"
            className="px-6 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            My orders
          </Link>
        </div>
      </div>
    </div>
  );
}

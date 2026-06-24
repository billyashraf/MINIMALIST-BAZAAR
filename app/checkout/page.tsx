"use client";

import { useCart } from "@/lib/store/cart";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, total, count } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    useCart.persist.rehydrate();
    setMounted(true);
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Checkout failed. Please try again.");
      setLoading(false);
      return;
    }

    router.push(body.url);
  };

  if (!mounted) return null;

  if (count() === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link href="/products" className="text-sm text-black underline underline-offset-2">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href="/products" className="text-lg font-bold tracking-tight">
          Minimalist Bazaar
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Review order</h1>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 mb-6">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 p-4">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                {item.image && (
                  <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">Qty {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold shrink-0">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>${total().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Shipping</span>
            <span>Calculated at payment</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-50">
            <span>Total</span>
            <span>${total().toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3.5 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Redirecting…" : "Pay with Stripe"}
        </button>

        <p className="text-xs text-gray-600 text-center mt-3">
          You will be redirected to Stripe to complete payment securely.
        </p>
      </main>
    </div>
  );
}

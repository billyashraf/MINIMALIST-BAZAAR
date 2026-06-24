"use client";

import { useCart } from "@/lib/store/cart";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function CartDrawer() {
  const { items, open, setOpen, remove, update, total, count } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    useCart.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Cart {count() > 0 && <span className="text-gray-600 font-normal text-sm">({count()})</span>}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-600 hover:text-gray-700 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 text-sm">Your cart is empty</p>
              <button
                onClick={() => setOpen(false)}
                className="mt-4 text-sm text-black underline underline-offset-2"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                  {item.image && (
                    <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => update(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded border border-gray-200 text-sm flex items-center justify-center hover:border-gray-400 transition-colors"
                    >−</button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => update(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded border border-gray-200 text-sm flex items-center justify-center hover:border-gray-400 transition-colors"
                    >+</button>
                    <button
                      onClick={() => remove(item.productId)}
                      className="ml-auto text-xs text-gray-600 hover:text-red-500 transition-colors"
                    >Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">${total().toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-600">Shipping and taxes calculated at checkout</p>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="block w-full py-3 bg-black text-white text-sm text-center rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

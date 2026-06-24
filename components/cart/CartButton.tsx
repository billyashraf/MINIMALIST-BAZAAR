"use client";

import { useCart } from "@/lib/store/cart";
import { useEffect, useState } from "react";

export default function CartButton() {
  const itemCount = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={() => setOpen(true)}
      className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
      aria-label="Open cart"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {mounted && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}

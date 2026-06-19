"use client";

import { useCart } from "@/lib/store/cart";
import { useEffect } from "react";

export default function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

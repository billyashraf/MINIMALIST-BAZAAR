"use client";

import { useCart } from "@/lib/store/cart";
import { useEffect, useState } from "react";

interface Props {
  productId: string;
  title: string;
  image: string;
  price: number;
}

export default function AddToCartButton({ productId, title, image, price }: Props) {
  const add = useCart((s) => s.add);
  const [mounted, setMounted] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const handleAdd = () => {
    add({ productId, title, image, price, quantity: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleAdd}
      className="w-full py-3 bg-black text-white text-center rounded-lg hover:bg-gray-900 transition-colors font-medium"
    >
      {added ? "✓ Added to cart" : "Add to cart"}
    </button>
  );
}

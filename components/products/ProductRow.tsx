"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Product {
  _id: unknown;
  title: string;
  images: string[];
  sourcePrice: number;
  salePrice: number;
  status: string;
}

const statusStyles: Record<string, string> = {
  listed: "bg-green-50 text-green-700",
  draft: "bg-yellow-50 text-yellow-700",
  disabled: "bg-gray-100 text-gray-500",
};

export default function ProductRow({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const id = String(product._id);

  const handleDelete = async () => {
    if (!confirm("Delete this product?")) return;
    setLoading(true);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const handleResetPrice = async () => {
    setLoading(true);
    await fetch(`/api/products/${id}/reset-price`, { method: "POST" });
    router.refresh();
  };

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {product.images[0] && (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <span className="font-medium text-gray-900 line-clamp-1">{product.title}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500">${product.sourcePrice.toFixed(2)}</td>
      <td className="px-4 py-3 font-medium">${product.salePrice.toFixed(2)}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
            statusStyles[product.status] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {product.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleResetPrice}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40"
          >
            Reset price
          </button>
          <Link
            href={`/dashboard/products/${id}/edit`}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

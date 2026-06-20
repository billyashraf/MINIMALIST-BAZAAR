"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateAffiliateLinkButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handle = async () => {
    setLoading(true);
    await fetch("/api/affiliate/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "Creating…" : "+ Create link"}
    </button>
  );
}

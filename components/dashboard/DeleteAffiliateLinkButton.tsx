"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAffiliateLinkButton({ linkId }: { linkId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handle = async () => {
    if (!confirm("Delete this affiliate link?")) return;
    setLoading(true);
    await fetch(`/api/affiliate/links/${linkId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
    >
      Delete
    </button>
  );
}

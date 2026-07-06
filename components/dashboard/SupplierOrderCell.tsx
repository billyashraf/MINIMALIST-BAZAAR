"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SupplierItem {
  title: string;
  quantity: number;
  sourceUrl?: string;
  sourceStore?: string;
  supplierStatus?: "pending" | "placed" | "manual_required" | "failed";
  supplierOrderId?: string;
  supplierNote?: string;
}

interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  placed: "bg-green-50 text-green-700",
  manual_required: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

const statusLabel: Record<string, string> = {
  pending: "Queued",
  placed: "Ordered",
  manual_required: "Buy manually",
  failed: "Failed",
};

function formatAddress(addr: ShippingAddress): string {
  return [addr.fullName, addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.postalCode}`, addr.country]
    .filter(Boolean)
    .join("\n");
}

interface Props {
  orderId: string;
  items: SupplierItem[];
  shippingAddress: ShippingAddress;
}

export default function SupplierOrderCell({ orderId, items, shippingAddress }: Props) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  const needsAttention = items.some((i) => i.supplierStatus === "manual_required" || i.supplierStatus === "failed");

  const handleRetry = async () => {
    setRetrying(true);
    await fetch(`/api/orders/${orderId}/supplier-retry`, { method: "POST" });
    setRetrying(false);
    router.refresh();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatAddress(shippingAddress));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-1.5 max-w-[220px]">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[item.supplierStatus ?? "pending"]}`}>
            {statusLabel[item.supplierStatus ?? "pending"]}
          </span>
          {item.supplierStatus === "manual_required" && item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-black underline underline-offset-2"
            >
              Buy from {item.sourceStore ?? "source"} ↗
            </a>
          )}
        </div>
      ))}

      {needsAttention && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? "Copied!" : "Copy shipping info"}
          </button>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {retrying ? "Retrying…" : "Retry auto-order"}
          </button>
        </div>
      )}
    </div>
  );
}

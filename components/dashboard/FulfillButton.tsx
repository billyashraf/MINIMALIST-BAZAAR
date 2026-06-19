"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Royal Mail", "Canada Post", "Other"];

type FulfillmentStatus = "processing" | "shipped" | "delivered" | "cancelled";

const nextStatus: Record<string, FulfillmentStatus> = {
  unfulfilled: "processing",
  processing: "shipped",
  shipped: "delivered",
};

const statusLabel: Record<string, string> = {
  unfulfilled: "Mark processing",
  processing: "Mark shipped",
  shipped: "Mark delivered",
};

interface Props {
  orderId: string;
  currentStatus: string;
}

export default function FulfillButton({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("UPS");
  const [trackingUrl, setTrackingUrl] = useState("");

  const next = nextStatus[currentStatus];
  if (!next) return null;

  const needsTracking = next === "shipped";

  const handleSubmit = async () => {
    setLoading(true);

    await fetch(`/api/orders/${orderId}/fulfill`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: next,
        ...(needsTracking ? { trackingNumber, carrier, trackingUrl } : {}),
      }),
    });

    setLoading(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => (needsTracking ? setOpen(true) : handleSubmit())}
        disabled={loading}
        className="text-xs px-2.5 py-1 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving…" : statusLabel[currentStatus]}
      </button>

      {/* Tracking modal */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add tracking info</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {CARRIERS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tracking number <span className="text-red-400">*</span>
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="1Z999AA10123456784"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tracking URL <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://tracking.ups.com/..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSubmit}
                disabled={!trackingNumber || loading}
                className="flex-1 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving…" : "Mark shipped"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

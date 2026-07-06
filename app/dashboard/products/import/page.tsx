"use client";

import { useState } from "react";
import ProductForm from "@/components/products/ProductForm";

interface FetchedProduct {
  title: string;
  description: string;
  images: string[];
  sourceStore: string;
  sourceUrl: string;
  sourcePrice: number;
  deliveryEstimate: string;
}

type Status = "idle" | "loading" | "done" | "error";

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [fetched, setFetched] = useState<FetchedProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setStatus("loading");
    setFetched(null);
    setErrorMsg("");

    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: trimmed }),
    });

    const body = await res.json();

    if (!res.ok) {
      setErrorMsg(body.error ?? "Could not fetch product data.");
      setStatus("error");
      return;
    }

    setFetched(body);
    setStatus("done");
  };

  const defaultValues = fetched
    ? {
        title: fetched.title,
        description: fetched.description,
        images: fetched.images.length
          ? fetched.images.map((u) => ({ url: u }))
          : [{ url: "" }],
        sourceStore: fetched.sourceStore,
        sourceUrl: fetched.sourceUrl,
        sourcePrice: fetched.sourcePrice,
        salePrice: fetched.sourcePrice,
        deliveryEstimate: fetched.deliveryEstimate,
        status: "draft" as const,
      }
    : undefined;

  const SUPPORTED = [
    { name: "Shopify stores", note: "any myshopify.com or /products/ URL" },
    { name: "eBay", note: "ebay.com listings" },
    { name: "Etsy", note: "etsy.com listings" },
    { name: "AliExpress", note: "aliexpress.com products" },
    { name: "Walmart", note: "walmart.com products" },
    { name: "Any site", note: "with structured product data" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Import product</h1>
      <p className="text-sm text-gray-600 mb-5">
        Paste a product URL and we&apos;ll extract the title, description, images, and price automatically.
      </p>

      {/* Supported stores */}
      <div className="flex flex-wrap gap-2 mb-5 max-w-2xl">
        {SUPPORTED.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700" title={s.note}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            {s.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 rounded-full text-xs text-red-600" title="Amazon blocks server-side requests">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          Amazon (limited)
        </span>
      </div>

      {/* URL input */}
      <div className="flex gap-2 mb-3 max-w-2xl">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          placeholder="https://www.ebay.com/itm/... or any Shopify / Etsy / AliExpress URL"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
        />
        <button
          onClick={handleFetch}
          disabled={status === "loading" || !url.trim()}
          className="px-5 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
        >
          {status === "loading" && (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {status === "loading" ? "Fetching…" : "Fetch product"}
        </button>
      </div>

      {/* Legal note */}
      <p className="text-xs text-gray-600 mb-8 max-w-2xl">
        Only import products you are authorised to resell. Verify the retailer&apos;s affiliate/API terms before publishing.
      </p>

      {/* Error */}
      {status === "error" && (
        <div className="max-w-2xl mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Pre-filled form */}
      {status === "done" && fetched && (
        <div>
          <div className="flex items-center gap-2 mb-6 max-w-2xl px-4 py-3 bg-green-50 border border-green-100 rounded-lg">
            <span className="text-green-600 text-sm font-medium">
              ✓ Product data fetched from {fetched.sourceStore}
            </span>
            <span className="text-green-500 text-xs ml-auto">
              Review and edit before publishing
            </span>
          </div>
          <ProductForm defaultValues={defaultValues} />
        </div>
      )}
    </div>
  );
}

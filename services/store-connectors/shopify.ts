import type { StoreConnector, ConnectorResult } from "./types";
import { fetchHtml, extractMeta, extractJsonLd, findProductSchema, parsePrice, extractHostname, absoluteUrl, stripHtml } from "./utils";

interface ShopifyVariant {
  price: string;
}
interface ShopifyImage {
  src: string;
}
interface ShopifyProduct {
  title?: string;
  body_html?: string;
  vendor?: string;
  variants?: ShopifyVariant[];
  images?: ShopifyImage[];
}

function productHandleFromUrl(url: string): string {
  // /products/handle  →  handle  (strips query + fragments)
  const m = new URL(url).pathname.match(/\/products\/([^/?#]+)/);
  return m?.[1] ?? "";
}

export const shopifyConnector: StoreConnector = {
  name: "Shopify",

  canHandle(url: string): boolean {
    if (url.includes("myshopify.com")) return true;
    try {
      return /\/products\/[^/?#]+/.test(new URL(url).pathname);
    } catch {
      return false;
    }
  },

  async fetch(url: string): Promise<ConnectorResult> {
    const hostname = extractHostname(url);

    // ── Strategy 1: Shopify product JSON endpoint ──────────────────────────
    // Every Shopify store exposes /products/[handle].json publicly
    const handle = productHandleFromUrl(url);
    if (handle) {
      const origin = new URL(url).origin;
      try {
        const res = await fetch(`${origin}/products/${handle}.json`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
          redirect: "follow",
        });

        if (res.ok) {
          const body = await res.json() as { product?: ShopifyProduct };
          const p = body.product;

          if (p?.title) {
            const price = parseFloat(p.variants?.[0]?.price ?? "0");
            const images = (p.images ?? []).map((i) => i.src).filter(Boolean).slice(0, 5);
            const description = stripHtml(p.body_html ?? "");

            return {
              success: true,
              data: {
                title: p.title,
                description,
                images,
                sourceStore: p.vendor || hostname,
                sourceUrl: url,
                sourcePrice: price,
                currency: "USD",
                deliveryEstimate: "",
              },
            };
          }
        }
      } catch { /* Shopify JSON unavailable — fall through */ }
    }

    // ── Strategy 2: HTML scraping fallback ─────────────────────────────────
    let html: string;
    try {
      html = await fetchHtml(url);
    } catch (e) {
      return { success: false, error: `Could not reach ${hostname}: ${(e as Error).message}` };
    }

    const meta = extractMeta(html);
    const product = findProductSchema(extractJsonLd(html));

    const title =
      (product?.name as string) ||
      meta["og:title"] ||
      meta["twitter:title"] ||
      "";

    if (!title) return { success: false, error: "Could not extract product title from this page." };

    const description =
      (product?.description as string) ||
      meta["og:description"] ||
      meta["description"] ||
      "";

    const images: string[] = [];
    if (product?.image) {
      const img = product.image;
      if (typeof img === "string") images.push(absoluteUrl(img, url));
      else if (Array.isArray(img)) images.push(...(img as string[]).map((i) => absoluteUrl(String(i), url)));
    }
    if (meta["og:image"]) images.push(absoluteUrl(meta["og:image"], url));

    let price = 0;
    let currency = "USD";
    if (product?.offers) {
      const offers = product.offers as Record<string, unknown>;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      price = parsePrice(offer?.price);
      currency = (offer?.priceCurrency as string) || "USD";
    }

    return {
      success: true,
      data: {
        title: title.trim(),
        description: description.trim(),
        images: [...new Set(images)].filter(Boolean).slice(0, 5),
        sourceStore: hostname,
        sourceUrl: url,
        sourcePrice: price,
        currency,
        deliveryEstimate: "",
      },
    };
  },
};

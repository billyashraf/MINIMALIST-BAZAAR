import type { StoreConnector, ConnectorResult } from "./types";
import { fetchHtmlResilient, BlockedError, extractMeta, extractJsonLd, findProductSchema, parsePrice, stripHtml, absoluteUrl } from "./utils";

export const etsyConnector: StoreConnector = {
  name: "Etsy",

  canHandle(url: string): boolean {
    return /etsy\.com/i.test(url);
  },

  async fetch(url: string): Promise<ConnectorResult> {
    let html: string;
    try {
      html = await fetchHtmlResilient(url, { referer: "https://www.etsy.com/" });
    } catch (e) {
      if (e instanceof BlockedError) return { success: false, error: e.message };
      return { success: false, error: `Could not reach Etsy: ${(e as Error).message}` };
    }

    const meta = extractMeta(html);
    const product = findProductSchema(extractJsonLd(html));

    const title =
      (product?.name as string) ||
      meta["og:title"] ||
      "";

    if (!title) return { success: false, error: "Could not extract product title from this Etsy listing." };

    const description =
      (product?.description as string) ||
      meta["og:description"] ||
      meta["description"] ||
      "";

    // Images — Etsy stores all images in Product schema as an array
    const images: string[] = [];
    if (product?.image) {
      const img = product.image;
      if (typeof img === "string") images.push(img);
      else if (Array.isArray(img)) images.push(...(img as string[]).map((i) => absoluteUrl(String(i), url)));
    }
    if (meta["og:image"]) images.push(absoluteUrl(meta["og:image"], url));
    // Also try twitter:image:src if available
    if (meta["twitter:image:src"]) images.push(absoluteUrl(meta["twitter:image:src"], url));

    let price = 0;
    let currency = "USD";
    if (product?.offers) {
      const offers = product.offers as Record<string, unknown>;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      price = parsePrice(offer?.price);
      currency = (offer?.priceCurrency as string) || "USD";
    }
    if (!price) {
      price = parsePrice(meta["product:price:amount"]) || 0;
      currency = meta["product:price:currency"] || "USD";
    }

    // Etsy title often has " | Etsy" suffix
    const cleanTitle = title.replace(/\s*\|\s*Etsy\s*$/i, "").trim();

    // Etsy seller name is usually in meta["og:site_name"] or schema seller
    const seller = (product?.brand as { name?: string })?.name ||
                   meta["og:site_name"]?.replace(/^etsy\s*[–-]\s*/i, "") ||
                   "Etsy";

    return {
      success: true,
      data: {
        title: cleanTitle,
        description: stripHtml(description).slice(0, 1500),
        images: [...new Set(images)].filter(Boolean).slice(0, 5),
        sourceStore: seller !== "Etsy" ? seller : "Etsy",
        sourceUrl: url,
        sourcePrice: price,
        currency,
        deliveryEstimate: "7–14 business days",
      },
    };
  },
};

import type { StoreConnector, ConnectorResult } from "./types";
import { fetchHtml, extractMeta, extractJsonLd, findProductSchema, parsePrice, absoluteUrl } from "./utils";

export const amazonConnector: StoreConnector = {
  name: "Amazon",

  canHandle(url: string) {
    return /amazon\.(com|co\.uk|de|fr|co\.jp|ca|com\.au)/i.test(url);
  },

  async fetch(url: string): Promise<ConnectorResult> {
    let html: string;
    try {
      html = await fetchHtml(url);
    } catch (e) {
      return { success: false, error: `Could not reach Amazon: ${(e as Error).message}` };
    }

    const meta = extractMeta(html);
    const product = findProductSchema(extractJsonLd(html));

    // Title — Amazon uses og:title reliably
    const title =
      (product?.name as string) ||
      meta["og:title"] ||
      "";

    if (!title) {
      return {
        success: false,
        error: "Amazon blocked this request. Try copying the product details manually.",
      };
    }

    // Description
    const description =
      (product?.description as string) ||
      meta["og:description"] ||
      "";

    // Images — Amazon puts the main image in og:image
    const images: string[] = [];
    if (product?.image) {
      const img = product.image;
      if (typeof img === "string") images.push(img);
      else if (Array.isArray(img))
        images.push(...(img as string[]).map((i) => absoluteUrl(i, url)));
    }
    if (meta["og:image"]) images.push(meta["og:image"]);

    // Price
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

    return {
      success: true,
      data: {
        title: title.replace(/\s*:\s*Amazon\..*$/, "").trim(),
        description: description.trim(),
        images: [...new Set(images)].filter(Boolean).slice(0, 5),
        sourceStore: "Amazon",
        sourceUrl: url,
        sourcePrice: price,
        currency,
        deliveryEstimate: "3–5 business days",
      },
    };
  },
};

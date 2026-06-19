import type { StoreConnector, ConnectorResult } from "./types";
import {
  fetchHtml,
  extractMeta,
  extractJsonLd,
  findProductSchema,
  parsePrice,
  extractHostname,
  absoluteUrl,
} from "./utils";

export const genericConnector: StoreConnector = {
  name: "Generic",

  canHandle() {
    return true; // fallback for any URL
  },

  async fetch(url: string): Promise<ConnectorResult> {
    let html: string;
    try {
      html = await fetchHtml(url);
    } catch (e) {
      return { success: false, error: `Could not reach URL: ${(e as Error).message}` };
    }

    const meta = extractMeta(html);
    const jsonLdBlocks = extractJsonLd(html);
    const product = findProductSchema(jsonLdBlocks);

    // --- Title ---
    const title =
      (product?.name as string) ||
      meta["og:title"] ||
      meta["twitter:title"] ||
      "";

    if (!title) {
      return { success: false, error: "Could not extract product title from this page." };
    }

    // --- Description ---
    const description =
      (product?.description as string) ||
      meta["og:description"] ||
      meta["description"] ||
      meta["twitter:description"] ||
      "";

    // --- Images ---
    const images: string[] = [];

    if (product?.image) {
      const img = product.image;
      if (typeof img === "string") images.push(absoluteUrl(img, url));
      else if (Array.isArray(img))
        images.push(...img.map((i: unknown) => absoluteUrl(String(i), url)));
    }

    if (meta["og:image"]) images.push(absoluteUrl(meta["og:image"], url));
    if (meta["twitter:image"]) images.push(absoluteUrl(meta["twitter:image"], url));

    const uniqueImages = [...new Set(images)].filter(Boolean).slice(0, 5);

    // --- Price ---
    let price = 0;
    let currency = "USD";

    if (product?.offers) {
      const offers = product.offers as Record<string, unknown>;
      const offerList = Array.isArray(offers) ? offers[0] : offers;
      price = parsePrice(offerList?.price);
      currency = (offerList?.priceCurrency as string) || "USD";
    }

    if (!price) {
      price =
        parsePrice(meta["product:price:amount"]) ||
        parsePrice(meta["og:price:amount"]) ||
        0;
      currency =
        meta["product:price:currency"] ||
        meta["og:price:currency"] ||
        "USD";
    }

    return {
      success: true,
      data: {
        title: title.trim(),
        description: description.trim(),
        images: uniqueImages,
        sourceStore: extractHostname(url),
        sourceUrl: url,
        sourcePrice: price,
        currency,
        deliveryEstimate: "",
      },
    };
  },
};

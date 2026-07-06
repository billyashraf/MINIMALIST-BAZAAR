import type { StoreConnector, ConnectorResult } from "./types";
import { fetchHtmlResilient, BlockedError, extractMeta, extractJsonLd, findProductSchema, parsePrice, extractHostname, absoluteUrl, stripHtml } from "./utils";

export const ebayConnector: StoreConnector = {
  name: "eBay",

  canHandle(url: string): boolean {
    return /ebay\.(com|co\.uk|de|fr|com\.au|ca)/i.test(url);
  },

  async fetch(url: string): Promise<ConnectorResult> {
    let html: string;
    try {
      html = await fetchHtmlResilient(url, { referer: "https://www.ebay.com/" });
    } catch (e) {
      if (e instanceof BlockedError) return { success: false, error: e.message };
      return { success: false, error: `Could not reach eBay: ${(e as Error).message}` };
    }

    const meta = extractMeta(html);
    const product = findProductSchema(extractJsonLd(html));

    // Title
    const title =
      (product?.name as string) ||
      meta["og:title"] ||
      "";

    if (!title) return { success: false, error: "Could not extract product title from this eBay listing." };

    // Description — eBay embeds a description iframe; use the meta description as fallback
    const description =
      (product?.description as string) ||
      meta["og:description"] ||
      meta["description"] ||
      "";

    // Images — eBay puts all gallery images in the Product schema
    const images: string[] = [];
    if (product?.image) {
      const img = product.image;
      if (typeof img === "string") images.push(img);
      else if (Array.isArray(img)) images.push(...(img as string[]).map((i) => String(i)));
    }
    if (meta["og:image"]) images.push(meta["og:image"]);

    // eBay also embeds images in a data-zoom-src / src on .ux-image-grid-item
    const imgRe = /data-zoom-src="([^"]+)"|class="img"[^>]+src="([^"]+)"/g;
    let m;
    while ((m = imgRe.exec(html)) !== null) {
      const src = absoluteUrl(m[1] || m[2], url);
      if (src.startsWith("http") && /\.(jpe?g|png|webp)/i.test(src)) images.push(src);
    }

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

    // eBay title cleanup
    const cleanTitle = title.replace(/\s*[|:]\s*eBay.*$/i, "").trim();

    return {
      success: true,
      data: {
        title: cleanTitle,
        description: stripHtml(description).slice(0, 1000),
        images: [...new Set(images)].filter(Boolean).slice(0, 5),
        sourceStore: "eBay",
        sourceUrl: url,
        sourcePrice: price,
        currency,
        deliveryEstimate: "5–10 business days",
      },
    };
  },
};

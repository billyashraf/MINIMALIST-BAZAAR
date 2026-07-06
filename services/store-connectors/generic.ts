import type { StoreConnector, ConnectorResult } from "./types";
import {
  fetchHtmlResilient,
  BlockedError,
  extractMeta,
  extractJsonLd,
  findProductSchema,
  parsePrice,
  extractHostname,
  absoluteUrl,
  stripHtml,
  extractNextData,
  extractImgTags,
} from "./utils";

export const genericConnector: StoreConnector = {
  name: "Generic",

  canHandle(): boolean {
    return true; // final fallback
  },

  async fetch(url: string): Promise<ConnectorResult> {
    let html: string;
    try {
      html = await fetchHtmlResilient(url);
    } catch (e) {
      if (e instanceof BlockedError) return { success: false, error: e.message };
      return { success: false, error: `Could not reach URL: ${(e as Error).message}` };
    }

    const meta = extractMeta(html);
    const jsonLdBlocks = extractJsonLd(html);
    const product = findProductSchema(jsonLdBlocks);

    // ── Title ──────────────────────────────────────────────────────────────
    let title =
      (product?.name as string) ||
      meta["og:title"] ||
      meta["twitter:title"] ||
      meta["title"] ||
      "";

    // Strip common site-name suffixes
    title = title.replace(/\s*[|–-]\s*[A-Z][a-zA-Z\s]+$/, "").trim();

    if (!title) {
      // Last resort: pull text from <title> tag
      const htmlTitle = /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1];
      title = htmlTitle?.replace(/\s*[|–-].*$/, "").trim() ?? "";
    }

    if (!title) return { success: false, error: "Could not extract a product title from this page." };

    // ── Description ────────────────────────────────────────────────────────
    const description =
      (product?.description as string) ||
      meta["og:description"] ||
      meta["description"] ||
      meta["twitter:description"] ||
      "";

    // ── Images ─────────────────────────────────────────────────────────────
    const images: string[] = [];

    if (product?.image) {
      const img = product.image;
      if (typeof img === "string") images.push(absoluteUrl(img, url));
      else if (Array.isArray(img))
        images.push(...(img as string[]).map((i) => absoluteUrl(String(i), url)));
    }
    if (meta["og:image"]) images.push(absoluteUrl(meta["og:image"], url));
    if (meta["twitter:image"]) images.push(absoluteUrl(meta["twitter:image"], url));
    if (meta["twitter:image:src"]) images.push(absoluteUrl(meta["twitter:image:src"], url));

    // If still no images, scan page <img> tags
    if (!images.length) {
      images.push(...extractImgTags(html, url));
    }

    // ── Price ──────────────────────────────────────────────────────────────
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

    // __NEXT_DATA__ fallback for Next.js / SSR stores
    if (!price || !images.length) {
      const nd = extractNextData(html);
      if (nd) {
        try {
          const pageProps = (nd.props as Record<string, unknown>)?.pageProps as Record<string, unknown>;
          const prod = pageProps?.product as Record<string, unknown> | undefined;
          if (prod) {
            if (!price) price = parsePrice(prod.price ?? prod.salePrice ?? 0);
            if (!images.length && prod.image) images.push(absoluteUrl(String(prod.image), url));
          }
        } catch { /* ignore */ }
      }
    }

    return {
      success: true,
      data: {
        title: title.trim(),
        description: stripHtml(description).slice(0, 1500).trim(),
        images: [...new Set(images)].filter(Boolean).slice(0, 5),
        sourceStore: extractHostname(url),
        sourceUrl: url,
        sourcePrice: price,
        currency,
        deliveryEstimate: "",
      },
    };
  },
};

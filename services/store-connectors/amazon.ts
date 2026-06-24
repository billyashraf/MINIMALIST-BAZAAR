import type { StoreConnector, ConnectorResult, ImportedProduct } from "./types";
import {
  fetchHtml,
  extractMeta,
  extractJsonLd,
  findProductSchema,
  parsePrice,
  absoluteUrl,
  stripHtml,
  extractTagText,
  extractDataAttr,
} from "./utils";

function parseAsin(url: string): string {
  const m = url.match(/(?:dp|gp\/product|d)\/([A-Z0-9]{10})/) ||
            url.match(/\/([A-Z0-9]{10})(?:[/?#]|$)/);
  return m?.[1] ?? "";
}

function mobileUrl(url: string): string {
  return url.replace(/^(https?:\/\/)(?:www\.|smile\.)?amazon\.(com|co\.uk|de|fr|ca|com\.au|co\.jp)/, "$1m.amazon.$2");
}

function extractFromHtml(html: string, url: string): Partial<ImportedProduct> {
  const meta = extractMeta(html);
  const product = findProductSchema(extractJsonLd(html));

  // --- Title ---
  let title =
    (product?.name as string) ||
    meta["og:title"] ||
    extractTagText(html, "id", "productTitle") ||
    extractTagText(html, "id", "title") ||
    "";
  title = title.replace(/\s*[–:]\s*Amazon\..*$/, "").replace(/- Amazon\..*$/, "").trim();

  // --- Description ---
  let description =
    (product?.description as string) ||
    meta["og:description"] ||
    "";

  // Bullet points from feature-bullets
  if (!description) {
    const bulletRe = /<span[^>]+class="[^"]*a-list-item[^"]*"[^>]*>([\s\S]*?)<\/span>/g;
    const bullets: string[] = [];
    let bm;
    while ((bm = bulletRe.exec(html)) !== null) {
      const t = stripHtml(bm[1]).trim();
      if (t.length > 10 && t.length < 300 && !t.startsWith("›")) bullets.push(t);
    }
    if (bullets.length) description = bullets.slice(0, 6).join("\n");
  }

  // --- Images ---
  const images: string[] = [];
  if (product?.image) {
    const img = product.image;
    if (typeof img === "string") images.push(img);
    else if (Array.isArray(img)) images.push(...(img as string[]).map((i) => absoluteUrl(i, url)));
  }
  if (meta["og:image"]) images.push(meta["og:image"]);

  // High-res image from data-old-hires attribute on #landingImage
  const hiRes = extractDataAttr(html, "landingImage", "data-old-hires") ||
                extractDataAttr(html, "landingImage", "src") ||
                extractDataAttr(html, "main-image", "src");
  if (hiRes) images.unshift(hiRes);

  // Image blocks from the JSON thumbnail rail that Amazon embeds as a script variable
  const imgBlockRe = /"(?:large|hiRes|thumb)"\s*:\s*"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/g;
  let im;
  while ((im = imgBlockRe.exec(html)) !== null) images.push(im[1]);

  // --- Price ---
  let price = 0;
  let currency = "USD";
  if (product?.offers) {
    const offers = product.offers as Record<string, unknown>;
    const offer = Array.isArray(offers) ? offers[0] : offers;
    price = parsePrice(offer?.price);
    currency = (offer?.priceCurrency as string) || "USD";
  }
  if (!price) {
    price = parsePrice(meta["product:price:amount"]) || parsePrice(meta["og:price:amount"]) || 0;
    currency = meta["product:price:currency"] || "USD";
  }
  if (!price) {
    // .a-price-whole + .a-price-fraction
    const wholePart = html.match(/class="[^"]*a-price-whole[^"]*"[^>]*>\s*(\d+)[,.]?\s*</)?.[1] ?? "";
    const fracPart = html.match(/class="[^"]*a-price-fraction[^"]*"[^>]*>\s*(\d+)\s*</)?.[1] ?? "00";
    if (wholePart) price = parseFloat(`${wholePart}.${fracPart}`);
  }

  return {
    title,
    description: description.trim(),
    images: [...new Set(images)].filter(Boolean).slice(0, 5),
    sourcePrice: price,
    currency,
  };
}

export const amazonConnector: StoreConnector = {
  name: "Amazon",

  canHandle(url: string) {
    return /amazon\.(com|co\.uk|de|fr|co\.jp|ca|com\.au)/i.test(url);
  },

  async fetch(url: string): Promise<ConnectorResult> {
    const asin = parseAsin(url);

    // Strategy 1: Desktop with full browser headers
    let partial: Partial<ImportedProduct> = {};
    try {
      const html = await fetchHtml(url, {
        extraCookies: "i18n-prefs=USD; lc-main=en_US; sp-cdn=L5Z9:MA",
      });
      partial = extractFromHtml(html, url);
    } catch { /* blocked — try mobile next */ }

    // Strategy 2: Mobile Amazon (m.amazon.com) — lighter bot detection
    if (!partial.title && asin) {
      try {
        const mUrl = mobileUrl(`https://www.amazon.com/dp/${asin}`);
        const html = await fetchHtml(mUrl, { mobile: true, timeoutMs: 12000 });
        partial = extractFromHtml(html, url);
      } catch { /* still blocked */ }
    }

    if (!partial.title) {
      return {
        success: false,
        error: "Amazon is blocking automated requests from server environments. " +
               "Try: eBay, Etsy, AliExpress, or any Shopify store instead — those work reliably. " +
               "For Amazon products, copy the details manually into the form.",
      };
    }

    return {
      success: true,
      data: {
        title: partial.title!,
        description: partial.description ?? "",
        images: partial.images ?? [],
        sourceStore: "Amazon",
        sourceUrl: url,
        sourcePrice: partial.sourcePrice ?? 0,
        currency: partial.currency ?? "USD",
        deliveryEstimate: "3–5 business days",
      },
    };
  },
};

import type { StoreConnector, ConnectorResult } from "./types";
import { fetchHtmlResilient, BlockedError, extractMeta, extractJsonLd, findProductSchema, parsePrice, extractHostname, absoluteUrl, stripHtml } from "./utils";

// AliExpress embeds product data in multiple script patterns
function extractAliData(html: string): { title?: string; price?: number; images?: string[]; description?: string } {
  // Pattern 1: window.runParams JSON blob
  const runParamsRe = /window\.runParams\s*=\s*(\{[\s\S]+?\});\s*(?:window|var|<\/script)/;
  const rpm = runParamsRe.exec(html);
  if (rpm) {
    try {
      const data = JSON.parse(rpm[1]) as Record<string, unknown>;
      // Navigate the nested structure AliExpress uses
      const pageData = (data.data as Record<string, unknown>) ?? data;
      const titleModule = pageData.titleModule as Record<string, unknown> | undefined;
      const priceModule = pageData.priceModule as Record<string, unknown> | undefined;
      const imageModule = pageData.imageModule as Record<string, unknown> | undefined;

      const title = (titleModule?.subject as string) ?? "";
      const price = parsePrice((priceModule?.minAmount as Record<string, unknown>)?.value ?? 0);
      const images = ((imageModule?.imagePathList as string[]) ?? [])
        .map((i) => (i.startsWith("http") ? i : `https:${i}`))
        .slice(0, 5);

      if (title) return { title, price, images };
    } catch { /* malformed JSON */ }
  }

  // Pattern 2: data-spm embedded JSON in specific script tags
  const scriptDataRe = /"subject"\s*:\s*"([^"]{5,})"[\s\S]{0,500}"formattedPrice"\s*:\s*"([^"]+)"/;
  const sdm = scriptDataRe.exec(html);
  if (sdm) {
    const title = sdm[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
    const price = parsePrice(sdm[2]);
    return { title, price };
  }

  return {};
}

export const aliexpressConnector: StoreConnector = {
  name: "AliExpress",

  canHandle(url: string): boolean {
    return /aliexpress\.(com|ru)/i.test(url);
  },

  async fetch(url: string): Promise<ConnectorResult> {
    let html: string;
    try {
      html = await fetchHtmlResilient(url, {
        referer: "https://www.aliexpress.com/",
        extraCookies: "aep_usuc_f=site=glo&c_tp=USD&isb=y&region=US&b_locale=en_US",
      });
    } catch (e) {
      if (e instanceof BlockedError) return { success: false, error: e.message };
      return { success: false, error: `Could not reach AliExpress: ${(e as Error).message}` };
    }

    const meta = extractMeta(html);
    const product = findProductSchema(extractJsonLd(html));
    const aliData = extractAliData(html);

    const title =
      aliData.title ||
      (product?.name as string) ||
      meta["og:title"] ||
      "";

    if (!title) return { success: false, error: "Could not extract product data from this AliExpress page." };

    const description =
      (product?.description as string) ||
      meta["og:description"] ||
      meta["description"] ||
      "";

    const images: string[] = [];
    if (aliData.images?.length) images.push(...aliData.images);
    if (product?.image) {
      const img = product.image;
      if (typeof img === "string") images.push(absoluteUrl(img, url));
      else if (Array.isArray(img)) images.push(...(img as string[]).map((i) => absoluteUrl(String(i), url)));
    }
    if (meta["og:image"]) images.push(absoluteUrl(meta["og:image"], url));

    let price = aliData.price ?? 0;
    let currency = "USD";
    if (!price && product?.offers) {
      const offers = product.offers as Record<string, unknown>;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      price = parsePrice(offer?.price);
      currency = (offer?.priceCurrency as string) || "USD";
    }

    const cleanTitle = title.replace(/\s*[-|]\s*AliExpress.*$/i, "").trim();

    return {
      success: true,
      data: {
        title: cleanTitle,
        description: stripHtml(description).slice(0, 1500),
        images: [...new Set(images)].filter(Boolean).slice(0, 5),
        sourceStore: "AliExpress",
        sourceUrl: url,
        sourcePrice: price,
        currency,
        deliveryEstimate: "15–30 business days",
      },
    };
  },
};

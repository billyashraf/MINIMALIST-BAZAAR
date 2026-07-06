import type { StoreConnector, ConnectorResult } from "./types";
import { fetchHtmlResilient, BlockedError, extractMeta, extractJsonLd, findProductSchema, parsePrice, absoluteUrl, stripHtml, extractNextData } from "./utils";

export const walmartConnector: StoreConnector = {
  name: "Walmart",

  canHandle(url: string): boolean {
    return /walmart\.com/i.test(url);
  },

  async fetch(url: string): Promise<ConnectorResult> {
    let html: string;
    try {
      html = await fetchHtmlResilient(url, { referer: "https://www.walmart.com/" });
    } catch (e) {
      if (e instanceof BlockedError) return { success: false, error: e.message };
      return { success: false, error: `Could not reach Walmart: ${(e as Error).message}` };
    }

    const meta = extractMeta(html);
    const product = findProductSchema(extractJsonLd(html));

    // Walmart embeds full product data in __NEXT_DATA__
    const nextData = extractNextData(html);
    let ndTitle = "";
    let ndPrice = 0;
    let ndImages: string[] = [];
    let ndDescription = "";

    if (nextData) {
      try {
        // Path: props.pageProps.initialData.data.product
        const pageProps = (nextData.props as Record<string, unknown>)?.pageProps as Record<string, unknown>;
        const initialData = pageProps?.initialData as Record<string, unknown>;
        const productData = (initialData?.data as Record<string, unknown>)?.product as Record<string, unknown>;

        ndTitle = (productData?.name as string) ?? "";
        ndDescription = stripHtml((productData?.shortDescription as string) ?? "");
        ndPrice = parsePrice((productData?.priceInfo as Record<string, unknown>)?.currentPrice ?? 0);

        const mediaList = productData?.imageInfo as Record<string, unknown>;
        const allImages = mediaList?.allImages as { url?: string }[] | undefined;
        ndImages = (allImages ?? []).map((i) => i.url ?? "").filter(Boolean).slice(0, 5);
      } catch { /* structure changed */ }
    }

    const title =
      ndTitle ||
      (product?.name as string) ||
      meta["og:title"] ||
      "";

    if (!title) return { success: false, error: "Could not extract product data from this Walmart page." };

    const description =
      ndDescription ||
      (product?.description as string) ||
      meta["og:description"] ||
      "";

    const images: string[] = [...ndImages];
    if (!images.length && product?.image) {
      const img = product.image;
      if (typeof img === "string") images.push(absoluteUrl(img, url));
      else if (Array.isArray(img)) images.push(...(img as string[]).map((i) => absoluteUrl(String(i), url)));
    }
    if (meta["og:image"]) images.push(absoluteUrl(meta["og:image"], url));

    let price = ndPrice;
    let currency = "USD";
    if (!price && product?.offers) {
      const offers = product.offers as Record<string, unknown>;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      price = parsePrice(offer?.price);
      currency = (offer?.priceCurrency as string) || "USD";
    }
    if (!price) price = parsePrice(meta["product:price:amount"]) || 0;

    return {
      success: true,
      data: {
        title: title.replace(/\s*[-|]\s*Walmart\.com.*$/i, "").trim(),
        description: description.slice(0, 1500),
        images: [...new Set(images)].filter(Boolean).slice(0, 5),
        sourceStore: "Walmart",
        sourceUrl: url,
        sourcePrice: price,
        currency,
        deliveryEstimate: "3–5 business days",
      },
    };
  },
};

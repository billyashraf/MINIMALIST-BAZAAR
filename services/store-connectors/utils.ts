export function extractMeta(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  // property/name before content
  const r1 = /<meta\s+(?:[^>]*?\s+)?(?:property|name)=["']([^"']+)["'][^>]*\s+content=["']([^"']*)["']/gi;
  // content before property/name
  const r2 = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']*)["'][^>]*\s+(?:property|name)=["']([^"']+)["']/gi;
  let m;
  while ((m = r1.exec(html)) !== null) tags[m[1].toLowerCase()] = m[2];
  while ((m = r2.exec(html)) !== null) tags[m[2].toLowerCase()] = m[1];
  return tags;
}

export function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed["@graph"]) results.push(...(parsed["@graph"] as Record<string, unknown>[]));
      else results.push(parsed);
    } catch { /* skip */ }
  }
  return results;
}

export function findProductSchema(blocks: Record<string, unknown>[]): Record<string, unknown> | null {
  return (
    blocks.find((b) => {
      const t = b["@type"];
      return t === "Product" || (Array.isArray(t) && t.includes("Product"));
    }) ?? null
  );
}

export function parsePrice(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export function extractHostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

export function absoluteUrl(src: string, base: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  try { return new URL(src, base).href; }
  catch { return src; }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Pluck text content of a single named HTML element (first match)
export function extractTagText(html: string, idOrClass: "id" | "class", name: string): string {
  const re = new RegExp(
    `<[a-z][^>]+${idOrClass}=["'][^"']*${name}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[a-z]+>`,
    "i"
  );
  const m = re.exec(html);
  return m ? stripHtml(m[1]).slice(0, 2000) : "";
}

// Extract value of a data attribute from an element with a given id
export function extractDataAttr(html: string, elementId: string, attrName: string): string {
  const re = new RegExp(`id=["']${elementId}["'][^>]*${attrName}=["']([^"']+)["']`, "i");
  const re2 = new RegExp(`${attrName}=["']([^"']+)["'][^>]*id=["']${elementId}["']`, "i");
  return (re.exec(html) ?? re2.exec(html))?.[1] ?? "";
}

// Try to parse a JSON variable from an inline <script> block
export function extractScriptJson(html: string, varPattern: string): Record<string, unknown> | null {
  const re = new RegExp(`${varPattern}\\s*=\\s*(\\{[\\s\\S]+?\\});\\s*(?:window|var|let|const|<\\/script)`, "i");
  const m = re.exec(html);
  if (!m) return null;
  try { return JSON.parse(m[1]) as Record<string, unknown>; }
  catch { return null; }
}

// Extract __NEXT_DATA__ which Walmart, some Shopify themes, etc. use
export function extractNextData(html: string): Record<string, unknown> | null {
  const m = /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!m) return null;
  try { return JSON.parse(m[1]) as Record<string, unknown>; }
  catch { return null; }
}

// Scan all <img> tags for the largest/best candidate images
export function extractImgTags(html: string, base: string): string[] {
  const urls: string[] = [];
  const re = /<img[^>]+(?:src|data-src|data-lazy|data-original)=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const src = absoluteUrl(m[1], base);
    if (
      src.startsWith("http") &&
      /\.(jpe?g|png|webp)/i.test(src) &&
      !/placeholder|loading|logo|icon|sprite|blank|pixel/i.test(src) &&
      src.length < 500
    ) {
      urls.push(src);
    }
  }
  return [...new Set(urls)].slice(0, 8);
}

interface FetchOptions {
  mobile?: boolean;
  referer?: string;
  extraCookies?: string;
  timeoutMs?: number;
}

// Full Chrome/Safari browser simulation — beats most bot-detection headers checks
export async function fetchHtml(url: string, opts: FetchOptions = {}): Promise<string> {
  const ua = opts.mobile
    ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
    : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

  const headers: Record<string, string> = {
    "User-Agent": ua,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": opts.referer ? "same-origin" : "none",
    "Sec-Fetch-User": "?1",
    ...(opts.mobile ? {} : {
      "sec-ch-ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    }),
    ...(opts.referer ? { "Referer": opts.referer } : {}),
    ...(opts.extraCookies ? { "Cookie": opts.extraCookies } : {}),
  };

  const res = await fetch(url, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

// Thrown when a source actively blocked us (bot-detection challenge, not a network failure)
export class BlockedError extends Error {}

const BLOCK_MARKERS = [
  "captcha",
  "are you a human",
  "access to this page has been denied",
  "access denied",
  "pardon our interruption",
  "just a moment", // Cloudflare interstitial
  "attention required", // Cloudflare
  "request unsuccessful. incapsula",
  "robot check",
  "unusual traffic",
  "px-captcha",
  "distil_r_captcha",
  "verify you are a human",
  "enable javascript and cookies",
];

// Bot-detection vendors often return HTTP 200 with a challenge page instead of an
// error status, so a status check alone misses them — scan the page body too.
export function looksBlocked(html: string): boolean {
  const head = html.slice(0, 6000).toLowerCase();
  return BLOCK_MARKERS.some((marker) => head.includes(marker));
}

const BLOCK_STATUS = [403, 429, 503];

function statusOf(e: unknown): number | null {
  const m = /^HTTP (\d{3})/.exec((e as Error)?.message ?? "");
  return m ? parseInt(m[1], 10) : null;
}

// fetchHtml with one automatic retry (mobile UA + search-engine referer) when the
// first attempt is rejected outright or comes back as a bot-detection challenge page.
export async function fetchHtmlResilient(url: string, opts: FetchOptions = {}): Promise<string> {
  let firstError: unknown = null;
  try {
    const html = await fetchHtml(url, opts);
    if (!looksBlocked(html)) return html;
    firstError = new BlockedError("Challenge page detected");
  } catch (e) {
    firstError = e;
  }

  try {
    const html = await fetchHtml(url, {
      ...opts,
      mobile: true,
      referer: opts.referer ?? "https://www.google.com/",
    });
    if (!looksBlocked(html)) return html;
  } catch { /* fall through to throw below */ }

  const wasBlocked = firstError instanceof BlockedError || BLOCK_STATUS.includes(statusOf(firstError) ?? -1);
  if (wasBlocked) {
    throw new BlockedError(`${extractHostname(url)} is blocking automated requests (anti-bot protection).`);
  }
  throw firstError instanceof Error ? firstError : new Error("Could not reach the page.");
}

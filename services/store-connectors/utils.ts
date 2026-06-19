export function extractMeta(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const regex =
    /<meta\s+(?:[^>]*?\s+)?(?:property|name)=["']([^"']+)["']\s+(?:[^>]*?\s+)?content=["']([^"']*)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    tags[match[1].toLowerCase()] = match[2];
  }
  // Also catch reversed attribute order (content first)
  const regex2 =
    /<meta\s+(?:[^>]*?\s+)?content=["']([^"']*)["']\s+(?:[^>]*?\s+)?(?:property|name)=["']([^"']+)["']/gi;
  while ((match = regex2.exec(html)) !== null) {
    tags[match[2].toLowerCase()] = match[1];
  }
  return tags;
}

export function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      // Handle @graph arrays
      if (parsed["@graph"]) {
        results.push(...(parsed["@graph"] as Record<string, unknown>[]));
      } else {
        results.push(parsed);
      }
    } catch {
      // skip malformed blocks
    }
  }
  return results;
}

export function findProductSchema(
  blocks: Record<string, unknown>[]
): Record<string, unknown> | null {
  return (
    blocks.find((b) => {
      const type = b["@type"];
      return (
        type === "Product" ||
        (Array.isArray(type) && type.includes("Product"))
      );
    }) ?? null
  );
}

export function parsePrice(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function absoluteUrl(src: string, base: string): string {
  if (src.startsWith("http")) return src;
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

import type { SupplierProvider, SupplierOrderInput, SupplierOrderResult } from "./types";

// Real CJ Dropshipping order-placement API (https://developers.cjdropshipping.com).
// Requires CJ_DROPSHIPPING_EMAIL + CJ_DROPSHIPPING_API_KEY (see README "Connect Purchasing
// Card" section) and a CJ account with a funded balance — CJ deducts the product cost from
// that balance when createOrder succeeds, it does not charge our Stripe integration.
//
// NOTE: field names below follow CJ's documented v2 API shape at the time of writing.
// CJ's API surface has changed before — re-verify against your dashboard's API docs
// before relying on this in production.

const BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

let cachedToken: { value: string; expiresAt: number } | null = null;

function isConfigured(): boolean {
  return Boolean(process.env.CJ_DROPSHIPPING_EMAIL && process.env.CJ_DROPSHIPPING_API_KEY);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const res = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.CJ_DROPSHIPPING_EMAIL,
      password: process.env.CJ_DROPSHIPPING_API_KEY,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const body = await res.json() as { data?: { accessToken?: string; accessTokenExpiryDate?: string } };
  const token = body.data?.accessToken;
  if (!res.ok || !token) throw new Error("CJ Dropshipping authentication failed");

  cachedToken = {
    value: token,
    // Fall back to a conservative 1-hour cache if CJ doesn't return an expiry.
    expiresAt: body.data?.accessTokenExpiryDate
      ? new Date(body.data.accessTokenExpiryDate).getTime() - 60_000
      : Date.now() + 60 * 60 * 1000,
  };
  return token;
}

function parseCjProductId(url: string): string {
  return /-p-(\d+)\.html/i.exec(url)?.[1] ?? "";
}

// Our Product model stores a single sourceUrl with no variant selection, so we take
// the product's default/first variant. Sellers dropshipping variant-specific SKUs
// from CJ should confirm the right vid manually until variant support (Phase 10
// "Variant support") lands.
async function getDefaultVariantId(pid: string, token: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/product/query?pid=${encodeURIComponent(pid)}`, {
    headers: { "CJ-Access-Token": token },
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json() as { data?: { variants?: { vid?: string }[] } };
  const vid = body.data?.variants?.[0]?.vid;
  if (!res.ok || !vid) throw new Error("Could not resolve a CJ product variant");
  return vid;
}

export const cjDropshippingProvider: SupplierProvider = {
  name: "CJ Dropshipping",

  canHandle(sourceStore: string, sourceUrl: string): boolean {
    return /cjdropshipping\.com/i.test(sourceStore) || /cjdropshipping\.com/i.test(sourceUrl);
  },

  async placeOrder(input: SupplierOrderInput): Promise<SupplierOrderResult> {
    if (!isConfigured()) {
      return {
        status: "manual_required",
        note: "CJ Dropshipping is not connected (missing CJ_DROPSHIPPING_EMAIL / CJ_DROPSHIPPING_API_KEY).",
      };
    }

    const pid = parseCjProductId(input.sourceUrl);
    if (!pid) {
      return { status: "manual_required", note: "Could not parse a CJ product id from the source URL." };
    }

    try {
      const token = await getAccessToken();
      const vid = await getDefaultVariantId(pid, token);

      const res = await fetch(`${BASE_URL}/shopping/order/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
        body: JSON.stringify({
          orderNumber: `MB-${input.orderId}-${pid}`,
          shippingCountryCode: input.shippingAddress.country,
          shippingProvince: input.shippingAddress.state,
          shippingCity: input.shippingAddress.city,
          shippingAddress: [input.shippingAddress.line1, input.shippingAddress.line2].filter(Boolean).join(", "),
          shippingZip: input.shippingAddress.postalCode,
          shippingCustomerName: input.shippingAddress.fullName,
          logisticName: "CJPacket Ordinary",
          products: [{ vid, quantity: input.quantity }],
        }),
        signal: AbortSignal.timeout(20000),
      });

      const body = await res.json() as { data?: { orderId?: string }; message?: string };
      if (!res.ok || !body.data?.orderId) {
        return { status: "failed", note: body.message ?? `CJ Dropshipping order creation failed (HTTP ${res.status}).` };
      }

      return { status: "placed", supplierOrderId: body.data.orderId };
    } catch (e) {
      return { status: "failed", note: `CJ Dropshipping request error: ${(e as Error).message}` };
    }
  },
};

import crypto from "crypto";
import type { SupplierProvider, SupplierOrderInput, SupplierOrderResult } from "./types";

// For sellers with a private/custom supplier relationship (an agent, a fulfillment
// house, or their own automation) that exposes a webhook to receive orders. We never
// touch the supplier's checkout ourselves — we hand off the order details and let
// their system place the purchase, then read back a confirmation id.
function signPayload(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export const webhookSupplierProvider: SupplierProvider = {
  name: "Custom supplier webhook",

  canHandle(): boolean {
    return Boolean(process.env.SUPPLIER_WEBHOOK_URL);
  },

  async placeOrder(input: SupplierOrderInput): Promise<SupplierOrderResult> {
    const url = process.env.SUPPLIER_WEBHOOK_URL;
    const secret = process.env.SUPPLIER_WEBHOOK_SECRET;
    if (!url) {
      return { status: "manual_required", note: "SUPPLIER_WEBHOOK_URL is not configured." };
    }

    const payload = JSON.stringify({
      orderId: input.orderId,
      product: {
        title: input.productTitle,
        sourceUrl: input.sourceUrl,
        sourceStore: input.sourceStore,
      },
      quantity: input.quantity,
      shippingAddress: input.shippingAddress,
      customerEmail: input.customerEmail,
    });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "X-Signature": signPayload(payload, secret) } : {}),
        },
        body: payload,
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return { status: "manual_required", note: `Supplier webhook returned HTTP ${res.status}.` };
      }

      const body = (await res.json().catch(() => null)) as { supplierOrderId?: string } | null;
      if (!body?.supplierOrderId) {
        return { status: "manual_required", note: "Supplier webhook did not confirm an order id." };
      }

      return { status: "placed", supplierOrderId: body.supplierOrderId };
    } catch (e) {
      return { status: "manual_required", note: `Could not reach supplier webhook: ${(e as Error).message}` };
    }
  },
};

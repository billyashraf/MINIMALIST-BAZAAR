import type { SupplierProvider, SupplierOrderResult } from "./types";

// Final fallback — always available, zero config. Used whenever no automated
// supplier integration can place the order (unsupported source, integration
// not configured, or the automated attempt itself failed).
export const manualProvider: SupplierProvider = {
  name: "Manual",

  canHandle(): boolean {
    return true;
  },

  async placeOrder(input): Promise<SupplierOrderResult> {
    return {
      status: "manual_required",
      note: `No automated supplier integration for ${input.sourceStore}. Buy this item manually from the source and enter tracking once it ships.`,
    };
  },
};

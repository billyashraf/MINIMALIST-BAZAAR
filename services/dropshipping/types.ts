export interface SupplierShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SupplierOrderInput {
  orderId: string;
  productTitle: string;
  sourceUrl: string;
  sourceStore: string;
  quantity: number;
  shippingAddress: SupplierShippingAddress;
  customerEmail?: string;
}

export type SupplierOrderResult =
  | { status: "placed"; supplierOrderId: string; note?: string }
  | { status: "manual_required"; note: string }
  | { status: "failed"; note: string };

export interface SupplierProvider {
  name: string;
  // Whether this provider is wired up to actually attempt an automated order for the given source.
  canHandle(sourceStore: string, sourceUrl: string): boolean;
  placeOrder(input: SupplierOrderInput): Promise<SupplierOrderResult>;
}

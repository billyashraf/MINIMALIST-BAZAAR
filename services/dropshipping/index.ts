import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { cjDropshippingProvider } from "./cjdropshipping";
import { webhookSupplierProvider } from "./webhookSupplier";
import { manualProvider } from "./manual";
import type { SupplierProvider } from "./types";

// Specific integrations checked first; manual is the always-available catch-all.
const providers: SupplierProvider[] = [cjDropshippingProvider, webhookSupplierProvider, manualProvider];

function pickProvider(sourceStore: string, sourceUrl: string): SupplierProvider {
  return providers.find((p) => p.canHandle(sourceStore, sourceUrl)) ?? manualProvider;
}

// Attempts to automatically place a supplier order for every item on a paid order.
// Safe to call more than once — already-placed items are left untouched, so retrying
// only re-attempts items still pending/manual/failed.
export async function routeSupplierOrder(orderId: string): Promise<void> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) return;

  const productIds = order.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const sellerIds = [...new Set(products.map((p) => String(p.sellerId)))];
  const sellers = await User.find({ _id: { $in: sellerIds } }).select("purchasing").lean();
  const sellerMap = new Map(sellers.map((s) => [String(s._id), s]));

  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    if (item.supplierStatus === "placed") continue; // already done, don't re-order

    const product = productMap.get(String(item.productId));
    if (!product) {
      order.items[i].supplierStatus = "manual_required";
      order.items[i].supplierNote = "Source product no longer exists — buy manually.";
      continue;
    }

    order.items[i].sourceUrl = product.sourceUrl;
    order.items[i].sourceStore = product.sourceStore;

    const seller = sellerMap.get(String(product.sellerId));
    if (!seller?.purchasing?.cardConnected) {
      order.items[i].supplierStatus = "manual_required";
      order.items[i].supplierNote = "Seller has not connected a purchasing payment method yet.";
      continue;
    }

    const provider = pickProvider(product.sourceStore, product.sourceUrl);
    const result = await provider.placeOrder({
      orderId: String(order._id),
      productTitle: product.title,
      sourceUrl: product.sourceUrl,
      sourceStore: product.sourceStore,
      quantity: item.quantity,
      shippingAddress: order.shippingAddress,
      customerEmail: order.customerEmail,
    });

    order.items[i].supplierStatus = result.status;
    order.items[i].supplierNote = result.note;
    if (result.status === "placed") order.items[i].supplierOrderId = result.supplierOrderId;
  }

  await order.save();
}

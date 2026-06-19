import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { sendShippingEmail } from "@/services/notifications/email";

export type FulfillmentStatus =
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface FulfillmentUpdate {
  status: FulfillmentStatus;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
}

export async function updateFulfillment(
  orderId: string,
  update: FulfillmentUpdate
): Promise<void> {
  await connectDB();

  const setFields: Record<string, unknown> = {
    fulfillmentStatus: update.status,
  };

  if (update.trackingNumber) setFields.trackingNumber = update.trackingNumber;
  if (update.carrier) setFields.carrier = update.carrier;
  if (update.trackingUrl) setFields.trackingUrl = update.trackingUrl;
  if (update.status === "shipped") setFields.shippedAt = new Date();
  if (update.status === "delivered") setFields.deliveredAt = new Date();

  const order = await Order.findByIdAndUpdate(
    orderId,
    { $set: setFields },
    { new: true }
  );

  if (!order) throw new Error("Order not found");

  // Send shipping email when status moves to shipped
  if (update.status === "shipped" && update.trackingNumber) {
    let email = order.customerEmail;

    // Fall back to looking up the customer's email
    if (!email && order.customerId) {
      const user = await User.findById(order.customerId).select("email name");
      if (user) {
        email = user.email;
        await Order.findByIdAndUpdate(orderId, { customerEmail: email });
      }
    }

    if (email) {
      await sendShippingEmail({
        to: email,
        customerName: order.shippingAddress.fullName,
        orderId: String(order._id),
        items: order.items.map((i) => ({ title: i.title, quantity: i.quantity })),
        trackingNumber: update.trackingNumber,
        carrier: update.carrier ?? "Carrier",
        trackingUrl: update.trackingUrl,
      });
    }
  }
}

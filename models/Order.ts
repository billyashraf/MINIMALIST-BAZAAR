import mongoose, { Schema, Document, Model } from "mongoose";

interface OrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  image: string;
  quantity: number;
  price: number;
  // Snapshot of the product's source at order time, used to route the supplier order
  sourceUrl?: string;
  sourceStore?: string;
  supplierStatus?: "pending" | "placed" | "manual_required" | "failed";
  supplierOrderId?: string;
  supplierNote?: string;
}

interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  fulfillmentStatus: "unfulfilled" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: ShippingAddress;
  stripePaymentIntentId?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  customerEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShippingAddressSchema = new Schema<ShippingAddress>(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const OrderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    sourceUrl: { type: String },
    sourceStore: { type: String },
    supplierStatus: {
      type: String,
      enum: ["pending", "placed", "manual_required", "failed"],
      default: "pending",
    },
    supplierOrderId: { type: String },
    supplierNote: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    fulfillmentStatus: {
      type: String,
      enum: ["unfulfilled", "processing", "shipped", "delivered", "cancelled"],
      default: "unfulfilled",
    },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    stripePaymentIntentId: { type: String },
    trackingNumber: { type: String },
    carrier: { type: String },
    trackingUrl: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    customerEmail: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ customerId: 1 });
OrderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);

export default Order;

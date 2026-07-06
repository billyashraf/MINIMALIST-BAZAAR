import mongoose, { Schema, Document, Model } from "mongoose";

interface PurchasingMethod {
  // Set once the seller connects a real payment method (see README "Connect Purchasing Card").
  // Automatic supplier ordering stays gated to manual_required until this is true.
  cardConnected: boolean;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  last4?: string;
  brand?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "customer" | "seller" | "admin";
  blocked: boolean;
  purchasing: PurchasingMethod;
  createdAt: Date;
  updatedAt: Date;
}

const PurchasingMethodSchema = new Schema<PurchasingMethod>(
  {
    cardConnected: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    stripePaymentMethodId: { type: String },
    last4: { type: String },
    brand: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    blocked: { type: Boolean, default: false },
    purchasing: { type: PurchasingMethodSchema, default: () => ({ cardConnected: false }) },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;

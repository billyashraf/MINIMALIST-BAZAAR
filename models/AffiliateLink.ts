import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAffiliateLink extends Document {
  productId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  slug: string;
  clicks: number;
  conversions: number;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateLinkSchema = new Schema<IAffiliateLink>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slug: { type: String, required: true, unique: true },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AffiliateLinkSchema.index({ productId: 1, sellerId: 1 });

const AffiliateLink: Model<IAffiliateLink> =
  mongoose.models.AffiliateLink ??
  mongoose.model<IAffiliateLink>("AffiliateLink", AffiliateLinkSchema);

export default AffiliateLink;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description: string;
  images: string[];
  sourceStore: string;
  sourceUrl: string;
  sourcePrice: number;
  salePrice: number;
  deliveryEstimate: string;
  status: "draft" | "listed" | "disabled";
  sellerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    sourceStore: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    sourcePrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    deliveryEstimate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "listed", "disabled"],
      default: "draft",
    },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1 });
ProductSchema.index({ sellerId: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);

export default Product;

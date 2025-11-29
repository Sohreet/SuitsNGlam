import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    stock: { type: Number, default: 0 },

    images: [String],
    video: { type: String, default: null },

    // ADD THIS (very important)
    collection: { type: String, default: "" },

    minMetres: { type: Number, default: 1 },
    maxMetres: { type: Number, default: 6 },

    isBestDeal: { type: Boolean, default: false },
    isSale: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);

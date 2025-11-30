const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },

  price: { type: Number, required: true },     // price per metre
  category: { type: String, required: true },

  description: { type: String, default: "" },

  stock: { type: Number, default: 10 },        // 0 = out of stock

  images: { type: [String], default: [] },     // base64 images (2–5)
  video: { type: String, default: "" },        // optional base64 video

  sale: { type: Boolean, default: false },     // admin toggle

  orderCount: { type: Number, default: 0 },    // used for Best Deals

  addedAt: { type: Date, default: Date.now }   // used for New Arrivals
});

module.exports = mongoose.model("Product", productSchema);

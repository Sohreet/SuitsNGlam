const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  pricePerMeter: Number,
  category: String,
  
  description: String,

  stock: { type: Number, default: 10 },

  images: { type: [String], default: [] },
  video: { type: String, default: "" },

  sale: { type: Boolean, default: false },

  orderCount: { type: Number, default: 0 },

  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);

const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  category: String,
  isBestDeal: Boolean,
  isSale: Boolean,
  minMetres: Number,
  maxMetres: Number,
  stock: Number,
  images: [String],   // file paths: /uploads/images/xxx.jpg
  video: String       // file path: /uploads/videos/xxx.mp4
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
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
  images: [String],   // ex: /uploads/images/abc.jpg
  video: String       // ex: /uploads/videos/video.mp4
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);

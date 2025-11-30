const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  description: String,
  stock: Number,
  images: [String],
  video: String,
  sale: Boolean,
  createdAt: Date
});

module.exports = mongoose.model("Product", ProductSchema);

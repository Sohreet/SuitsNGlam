const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  description: String,
  stock: Number,
  images: [String],     // base64 strings
  video: String,        // base64 string (optional)
  sale: Boolean,
  createdAt: Date
});

module.exports = mongoose.model("Product", productSchema);

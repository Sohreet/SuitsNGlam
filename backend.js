// ------------------------------------------------------
// SUITS N GLAM — FULL BACKEND (MERGED INTO ONE FILE)
// Google Login Compatible — NO "*" catch-all breaking GSI
// ------------------------------------------------------

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// ------------------------------------------------------
// 1) DATABASE SETUP
// ------------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// ------------------------------------------------------
// 2) PRODUCT MODEL (MERGED)
// ------------------------------------------------------
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  description: String,
  stock: Number,
  images: [String],
  video: String,
  sale: Number,
  createdAt: Date
});

const Product = mongoose.model("Product", ProductSchema);

// ------------------------------------------------------
// 3) MIDDLEWARE
// ------------------------------------------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------
// 4) GOOGLE SAFE ROUTES (DO NOT CATCH THESE)
// ------------------------------------------------------
const googleSafe = ["/.well-known", "/_", "/gsi", "/google", "/oauth2"];

app.use((req, res, next) => {
  if (googleSafe.some((p) => req.path.startsWith(p))) return next();
  next();
});

// ------------------------------------------------------
// 5) ADMIN — ADD PRODUCT
// ------------------------------------------------------
app.post("/api/admin/products", async (req, res) => {
  try {
    const { name, price, category, description, stock, images, video, sale } =
      req.body;

    if (!name || !price || !category) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const newP = new Product({
      name,
      price,
      category,
      description,
      stock,
      images,
      video,
      sale,
      createdAt: new Date()
    });

    await newP.save();

    res.json({ success: true, product: newP });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ------------------------------------------------------
// 6) ADMIN — DELETE PRODUCT
// ------------------------------------------------------
app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: "Delete failed" });
  }
});

// ------------------------------------------------------
// 7) GET ALL PRODUCTS
// ------------------------------------------------------
app.get("/api/products/category/all", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// ------------------------------------------------------
// 8) GET CATEGORY PRODUCTS
// ------------------------------------------------------
app.get("/api/products/category/:cat", async (req, res) => {
  const products = await Product.find({ category: req.params.cat }).sort({
    createdAt: -1
  });
  res.json(products);
});

// ------------------------------------------------------
// 9) GET SINGLE PRODUCT
// ------------------------------------------------------
app.get("/api/products/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  res.json(p);
});

// ------------------------------------------------------
// 10) FRONTEND ROUTES ONLY
// (We do not catch everything to avoid breaking Google login)
// ------------------------------------------------------
const pages = [
  "/",
  "/index.html",
  "/allproducts.html",
  "/newarrivals.html",
  "/summer.html",
  "/winter.html",
  "/wedding.html",
  "/casuals.html",
  "/dailywear.html",
  "/premiumwear.html",
  "/sales.html",
  "/bestdeals.html",
  "/cart.html",
  "/product.html",
  "/account.html",
  "/admin.html"
];

pages.forEach((r) => {
  app.get(r, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
});

// ------------------------------------------------------
// 11) START SERVER
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Suits N Glam Backend Running on port ${PORT}`)
);

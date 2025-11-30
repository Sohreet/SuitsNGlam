// ------------------------------------------------------
// SUITS N GLAM — PRODUCTION BACKEND (FINAL)
// ------------------------------------------------------

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// ------------------------------------------------------
// DATABASE CONNECTION (Render Compatible)
// ------------------------------------------------------
// IMPORTANT: Set env variable MONGO_URI on Render

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
  });

// ------------------------------------------------------
// MODELS
// ------------------------------------------------------
const Product = require("./models/Product");

// ------------------------------------------------------
// MIDDLEWARE
// ------------------------------------------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));


// ------------------------------------------------------
// ADMIN — ADD PRODUCT
// ------------------------------------------------------
app.post("/api/admin/products", async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      description,
      stock,
      images,
      video,
      sale
    } = req.body;

    if (!name || !price || !category) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const newProduct = new Product({
      name,
      price,
      category,
      description,
      stock,
      images,
      video,
      sale,
      createdAt: new Date(),
    });

    await newProduct.save();

    res.json({ success: true, product: newProduct });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Server error" });
  }
});


// ------------------------------------------------------
// ADMIN — DELETE PRODUCT
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
// GET ALL PRODUCTS
// ------------------------------------------------------
app.get("/api/products/category/all", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// ------------------------------------------------------
// GET SPECIFIC CATEGORY
// ------------------------------------------------------
app.get("/api/products/category/:cat", async (req, res) => {
  const cat = req.params.cat;
  const products = await Product.find({ category: cat }).sort({ createdAt: -1 });
  res.json(products);
});

// ------------------------------------------------------
// GET SINGLE PRODUCT
// ------------------------------------------------------
app.get("/api/products/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  res.json(p);
});


// ------------------------------------------------------
// CATCH-ALL — FOR REACT/HTML ROUTING
// ------------------------------------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// ------------------------------------------------------
// SERVER START
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

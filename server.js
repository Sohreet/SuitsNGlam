const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();

// CONNECT MONGODB
mongoose
  .connect("mongodb://127.0.0.1:27017/suitsnglam", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// MODELS
const Product = require("./models/Product");

// MIDDLEWARE
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// PUBLIC FOLDER
app.use(express.static(path.join(__dirname, "public")));


// ------------------------------------------------------------
//  API ROUTES (MUST BE ABOVE CATCH-ALL)
// ------------------------------------------------------------

// ADD PRODUCT (ADMIN)
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
      return res.json({ success: false, message: "Missing required fields" });
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
      createdAt: new Date()
    });

    await newProduct.save();

    res.json({ success: true, product: newProduct });

  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Server error" });
  }
});

// GET ALL PRODUCTS
app.get("/api/products/category/all", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// GET BY CATEGORY
app.get("/api/products/category/:cat", async (req, res) => {
  const cat = req.params.cat;
  const products = await Product.find({ category: cat }).sort({ createdAt: -1 });
  res.json(products);
});

// GET SINGLE PRODUCT
app.get("/api/products/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  res.json(p);
});

// ------------------------------------------------------------
// CATCH-ALL — MUST BE LAST
// ------------------------------------------------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));

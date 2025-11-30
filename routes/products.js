const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ADD PRODUCT (ADMIN)
router.post("/admin/products", async (req, res) => {
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

    if (!images || images.length < 2) {
      return res.json({ success: false, message: "At least 2 images required" });
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
    res.json({ success: false });
  }
});

// GET ALL PRODUCTS (FOR ADMIN + CLIENT)
router.get("/category/all", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// GET BY CATEGORY
router.get("/category/:cat", async (req, res) => {
  const cat = req.params.cat.toLowerCase();
  const products = await Product.find({ category: cat });
  res.json(products);
});

// GET SINGLE PRODUCT
router.get("/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  res.json(p);
});

module.exports = router;

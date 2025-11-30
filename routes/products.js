const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

/******************************************************
 * ADD PRODUCT — Admin
 ******************************************************/
router.post("/admin/products", async (req, res) => {
  try {
    const { name, price, category, description, stock, images, video, sale } = req.body;

    const product = await Product.create({
      name,
      price,
      pricePerMeter: price,
      category: category.toLowerCase(),
      description,
      stock: stock ?? 10,
      images,
      video,
      sale: sale || false,
      addedAt: new Date(),
    });

    res.json({ success: true, product });

  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/******************************************************
 * GET PRODUCTS BY CATEGORY
 ******************************************************/
router.get("/products/category/:category", async (req, res) => {
  try {
    let category = req.params.category.toLowerCase();
    let products;

    if (category === "all") {
      products = await Product.find({});
    }

    else if (category === "newarrivals") {
      const limit = Date.now() - (15 * 24 * 60 * 60 * 1000);
      products = await Product.find({ addedAt: { $gte: limit } });
    }

    else if (category === "bestdeals") {
      products = await Product.find({ orderCount: { $gte: 10 } });
    }

    else if (category === "sales") {
      products = await Product.find({ sale: true });
    }

    else {
      products = await Product.find({ category });
    }

    res.json(products);

  } catch (err) {
    console.error("Category load error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/******************************************************
 * GET PRODUCT BY ID (for product.html)
 ******************************************************/
router.get("/products/:id", async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Not found" });

    res.json(p);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

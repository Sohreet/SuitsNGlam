const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const upload = require("../middleware/multer");

/* GET all products */
router.get("/", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

/* GET single product */
router.get("/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  res.json(p);
});

/* CREATE product */
router.post("/", upload.any(), async (req, res) => {
  const {
    title, price, description, category,
    isBestDeal, isSale, minMetres, maxMetres, stock
  } = req.body;

  const images = [];
  let video = "";

  if (req.files) {
    req.files.forEach(file => {
      if (file.mimetype.startsWith("image/")) images.push("/uploads/images/" + file.filename);
      if (file.mimetype.startsWith("video/")) video = "/uploads/videos/" + file.filename;
    });
  }

  const product = await Product.create({
    title,
    price,
    description,
    category,
    isBestDeal,
    isSale,
    minMetres,
    maxMetres,
    stock,
    images,
    video
  });

  res.json({ message: "Product created", product });
});

/* UPDATE product */
router.put("/:id", upload.any(), async (req, res) => {
  const p = await Product.findById(req.params.id);

  if (!p) return res.json({ message: "Not found" });

  const {
    title, price, description, category,
    isBestDeal, isSale, minMetres, maxMetres, stock
  } = req.body;

  let images = p.images;
  let video = p.video;

  // Add new files
  if (req.files) {
    req.files.forEach(file => {
      if (file.mimetype.startsWith("image/")) {
        images.push("/uploads/images/" + file.filename);
      }
      if (file.mimetype.startsWith("video/")) {
        video = "/uploads/videos/" + file.filename;
      }
    });
  }

  await Product.findByIdAndUpdate(req.params.id, {
    title,
    price,
    description,
    category,
    isBestDeal,
    isSale,
    minMetres,
    maxMetres,
    stock,
    images,
    video
  });

  res.json({ message: "Product updated" });
});

/* DELETE product */
router.delete("/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});

module.exports = router;
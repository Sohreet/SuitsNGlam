// ------------------------------------------------------
// SUITS N GLAM — FULL BACKEND (RENDER SAFE + CLEAN)
// Email Login + Google Login (client-side verified)
// Products + Orders + Admin
// ------------------------------------------------------

require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();

/* ------------------------------------------------------
   DATABASE
------------------------------------------------------ */
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/suitsnglam";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

/* ------------------------------------------------------
   SCHEMAS
------------------------------------------------------ */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  password: String,
  picture: String,
  createdAt: { type: Date, default: () => new Date() },
});

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  description: String,
  stock: Number,
  images: [String],
  video: String,
  sale: Number,
  createdAt: { type: Date, default: () => new Date() },
});

const OrderSchema = new mongoose.Schema({
  userEmail: String,
  items: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      metres: Number,
      image: String,
    },
  ],
  total: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: () => new Date() },
  meta: Object,
});

const User = mongoose.model("User", UserSchema);
const Product = mongoose.model("Product", ProductSchema);
const Order = mongoose.model("Order", OrderSchema);

/* ------------------------------------------------------
   MIDDLEWARE
------------------------------------------------------ */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* Static files */
app.use(express.static(path.join(__dirname, "public")));

/* Google safe paths */
const googleSafe = ["/.well-known", "/google", "/gsi", "/auth", "/oauth2"];
app.use((req, res, next) => {
  if (googleSafe.some((p) => req.path.startsWith(p))) return next();
  next();
});

/* ------------------------------------------------------
   AUTH — EMAIL REGISTER
------------------------------------------------------ */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password)
      return res.json({ success: false, message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.json({
        success: false,
        message: "Email already registered",
      });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name || email.split("@")[0],
      email,
      password: hashed,
      picture: "/images/default-user.png",
    });

    await newUser.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------
   AUTH — EMAIL LOGIN
------------------------------------------------------ */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.json({ success: false, message: "Incorrect password" });

    return res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------
   PRODUCTS — ADMIN ADD PRODUCT
------------------------------------------------------ */
app.post("/api/admin/products", async (req, res) => {
  try {
    const { name, price, category, description, stock, images, video, sale } =
      req.body;

    if (!name || !price || !category)
      return res.json({ success: false, message: "Missing fields" });

    const p = new Product({
      name,
      price,
      category,
      description,
      stock,
      images,
      video,
      sale,
    });

    await p.save();
    res.json({ success: true, product: p });
  } catch (err) {
    console.error("Add product error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------
   PRODUCTS — DELETE PRODUCT
------------------------------------------------------ */
app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete product error:", err);
    res.json({ success: false, message: "Delete failed" });
  }
});

/* ------------------------------------------------------
   PRODUCTS — LIST ALL
------------------------------------------------------ */
app.get("/api/products/category/all", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

/* ------------------------------------------------------
   PRODUCTS — CATEGORY
------------------------------------------------------ */
app.get("/api/products/category/:cat", async (req, res) => {
  const products = await Product.find({ category: req.params.cat }).sort({
    createdAt: -1,
  });
  res.json(products);
});

/* ------------------------------------------------------
   PRODUCTS — SINGLE
------------------------------------------------------ */
app.get("/api/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});

/* ------------------------------------------------------
   ORDERS — CREATE ORDER
------------------------------------------------------ */
app.post("/api/orders", async (req, res) => {
  try {
    const { email, items, total, meta } = req.body;

    if (!email || !items || items.length === 0)
      return res.json({ success: false, message: "Invalid order" });

    const order = new Order({
      userEmail: email,
      items,
      total,
      meta,
    });

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    console.error("Order error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------
   ORDERS — USER ORDER HISTORY
------------------------------------------------------ */
app.get("/api/orders/history/:email", async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error("Order history error:", err);
    res.json([]);
  }
});

/* ------------------------------------------------------
   STATIC FRONTEND (RENDER SAFE)
------------------------------------------------------ */
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ------------------------------------------------------
   START SERVER — NO FALLBACK PORT (REQUIRED BY RENDER)
------------------------------------------------------ */
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Suits N Glam Backend Running on port ${PORT}`);
});

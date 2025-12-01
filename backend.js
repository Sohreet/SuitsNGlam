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
const cors = require("cors");

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
  items: Array,
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
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* Serve static frontend */
app.use(express.static(path.join(__dirname, "public")));

/* Google safe paths */
const googleSafe = ["/.well-known", "/google", "/gsi", "/auth", "/oauth", "/oauth2", "/signin", "/_"];
app.use((req, res, next) => {
  if (googleSafe.some((p) => req.path.startsWith(p))) return next();
  next();
});

/* ------------------------------------------------------
   AUTH — REGISTER
------------------------------------------------------ */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    await new User({
      name: name || email.split("@")[0],
      email,
      password: hashed,
      picture: "/images/default-user.png",
    }).save();

    res.json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------
   AUTH — LOGIN
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

    res.json({
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
   PRODUCTS — ADD PRODUCT (Admin)
------------------------------------------------------ */
app.post("/api/admin/products", async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.json({ success: true, product: p });
  } catch (err) {
    console.error("Add product error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------
   PRODUCTS — DELETE
------------------------------------------------------ */
app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: "Delete failed" });
  }
});

/* ------------------------------------------------------
   PRODUCTS — LIST ALL
------------------------------------------------------ */
app.get("/api/products/category/all", async (req, res) => {
  res.json(await Product.find().sort({ createdAt: -1 }));
});

/* ------------------------------------------------------
   PRODUCTS — CATEGORY
------------------------------------------------------ */
app.get("/api/products/category/:cat", async (req, res) => {
  res.json(await Product.find({ category: req.params.cat }).sort({ createdAt: -1 }));
});

/* ------------------------------------------------------
   PRODUCTS — SINGLE
------------------------------------------------------ */
app.get("/api/products/:id", async (req, res) => {
  res.json(await Product.findById(req.params.id));
});

/* ------------------------------------------------------
   ORDERS — CREATE
------------------------------------------------------ */
app.post("/api/orders", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    console.error("Order error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------
   ORDERS — USER HISTORY
------------------------------------------------------ */
app.get("/api/orders/history/:email", async (req, res) => {
  res.json(await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 }));
});

/* ------------------------------------------------------
   FRONTEND FALLBACK (Render)
------------------------------------------------------ */
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ------------------------------------------------------
   START SERVER
------------------------------------------------------ */
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));

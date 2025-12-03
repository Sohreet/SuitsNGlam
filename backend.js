// ------------------------------------------------------
// SUITS N GLAM — COMPLETE BACKEND (FINAL FIXED VERSION)
// Auth + Google Login Safe + OTP (dev) + Products + Orders
// Render + Hostinger Compatible
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
  isAdmin: { type: Boolean, default: false },
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

/* PUBLIC STATIC FILES */
app.use(express.static(path.join(__dirname, "public")));

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
    res.json({ success: false });
  }
});

/* ------------------------------------------------------
   AUTH — LOGIN
------------------------------------------------------ */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.json({ success: false, message: "Password incorrect" });

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.json({ success: false });
  }
});

/* ------------------------------------------------------
   OTP — SEND (DEVELOPMENT MODE)
------------------------------------------------------ */
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: "Missing email" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    console.log(`OTP for ${email}: ${otp}`);

    return res.json({ success: true, otp });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.json({ success: false });
  }
});

/* ------------------------------------------------------
   ADMIN — CREATE
------------------------------------------------------ */
app.post("/api/admin/create-admin", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists)
    return res.json({ success: false, message: "Admin exists" });

  const hashed = await bcrypt.hash(password, 10);

  await new User({ email, password: hashed, isAdmin: true }).save();

  res.json({ success: true, message: "Admin created" });
});

/* ------------------------------------------------------
   PRODUCTS — ADD
------------------------------------------------------ */
app.post("/api/admin/products", async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.json({ success: true, product: p });
  } catch (err) {
    console.error("Product add error:", err);
    res.json({ success: false });
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
    console.error("Product delete error:", err);
    res.json({ success: false });
  }
});

/* ------------------------------------------------------
   PRODUCTS — LIST ALL
------------------------------------------------------ */
app.get("/api/products/category/all", async (req, res) => {
  res.json(await Product.find().sort({ createdAt: -1 }));
});

/* ------------------------------------------------------
   PRODUCTS — BY CATEGORY
------------------------------------------------------ */
app.get("/api/products/category/:cat", async (req, res) => {
  res.json(
    await Product.find({ category: req.params.cat }).sort({ createdAt: -1 })
  );
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
    console.error("Order create error:", err);
    res.json({ success: false });
  }
});

/* ------------------------------------------------------
   ORDERS — USER HISTORY
------------------------------------------------------ */
app.get("/api/orders/history/:email", async (req, res) => {
  res.json(
    await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 })
  );
});

/* ------------------------------------------------------
   FRONTEND FALLBACK (Google Safe)
------------------------------------------------------ */
app.get(/^(?!\/api|\/gsi|\/google|\/oauth|\/oauth2|\/signin|\/_).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ------------------------------------------------------
   START SERVER
------------------------------------------------------ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

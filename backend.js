// ------------------------------------------------------
// SUITS N GLAM — COMPLETE BACKEND (FINAL FIXED VERSION)
// Auth + Google Login Safe + OTP (dev) + Products + Orders
// ------------------------------------------------------

require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

/* DATABASE ------------------------------------------------------ */
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/suitsnglam";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err.message));

/* SCHEMAS ------------------------------------------------------ */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
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
});

const User = mongoose.model("User", UserSchema);
const Product = mongoose.model("Product", ProductSchema);
const Order = mongoose.model("Order", OrderSchema);

/* MIDDLEWARE ------------------------------------------------------ */
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

/* AUTH — REGISTER ------------------------------------------------------ */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password)
      return res.json({ success: false, message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.json({ success: false, message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    await new User({
      name: name || email.split("@")[0],
      email,
      password: hash,
      picture: "/images/default-user.png",
    }).save();

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

/* AUTH — LOGIN ------------------------------------------------------ */
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
  } catch {
    res.json({ success: false });
  }
});

/* OTP (DEV) ------------------------------------------------------ */
app.post("/api/auth/send-otp", (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false });

  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log("OTP for", email, "=", otp);

  res.json({ success: true, otp });
});

/* ADMIN CREATE ------------------------------------------------------ */
app.post("/api/admin/create-admin", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.json({ success: false, message: "Admin exists" });

  const hash = await bcrypt.hash(password, 10);
  await new User({ email, password: hash, isAdmin: true }).save();

  res.json({ success: true });
});

/* PRODUCTS ------------------------------------------------------ */
app.post("/api/admin/products", async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.json({ success: true, product: p });
  } catch {
    res.json({ success: false });
  }
});

app.delete("/api/admin/products/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get("/api/products/category/all", async (_req, res) => {
  res.json(await Product.find().sort({ createdAt: -1 }));
});

app.get("/api/products/category/:cat", async (req, res) => {
  res.json(await Product.find({ category: req.params.cat }).sort({ createdAt: -1 }));
});

app.get("/api/products/:id", async (req, res) => {
  res.json(await Product.findById(req.params.id));
});

/* ORDERS ------------------------------------------------------ */
app.post("/api/orders", async (req, res) => {
  const o = new Order(req.body);
  await o.save();
  res.json({ success: true, order: o });
});

app.get("/api/orders/history/:email", async (req, res) => {
  res.json(await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 }));
});

/* GOOGLE-SAFE FRONTEND FALLBACK ------------------------------------------------------ */
app.get(/^(?!\/api|\/gsi|\/google|\/oauth|\/oauth2|\/signin|\/_).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* START ------------------------------------------------------ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("🚀 Backend running on", PORT));

// ------------------------------------------------------
// SUITS N GLAM — COMPLETE BACKEND (ONE FILE)
// Auth + Google Login Safe + OTP Email + Admin Creation
// Products + Orders + Render Deployment Safe
// ------------------------------------------------------

require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const nodemailer = require("nodemailer");

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

/* Serve static frontend */
app.use(express.static(path.join(__dirname, "public")));

/* Google safe paths (Render fix) */
const googleSafe = ["/.well-known", "/google", "/gsi", "/auth", "/oauth", "/oauth2", "/signin", "/_"];
app.use((req, res, next) => {
  if (googleSafe.some((p) => req.path.startsWith(p))) return next();
  next();
});

/* ------------------------------------------------------
   OTP EMAIL FUNCTION
------------------------------------------------------ */
async function sendOtpEmail(to, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail app password
      },
    });

    await transporter.sendMail({
      from: `"Suits N Glam" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your OTP Code - Suits N Glam",
      html: `
        <h2>Your OTP Code</h2>
        <p>Use the following OTP to continue:</p>
        <h1>${otp}</h1>
        <p>This code expires in <b>${process.env.OTP_EXPIRES_MINUTES} minutes</b>.</p>
      `,
    });

    return true;
  } catch (err) {
    console.error("OTP Email Error:", err);
    return false;
  }
}

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
   OTP — SEND
------------------------------------------------------ */
app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  const ok = await sendOtpEmail(email, otp);
  if (!ok) return res.json({ success: false, message: "Email failed" });

  res.json({ success: true, otp });
});

/* ------------------------------------------------------
   ADMIN — CREATE FROM SCRIPT (merged)
------------------------------------------------------ */
app.post("/api/admin/create-admin", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.json({ success: false, message: "Admin exists" });

  const hashed = await bcrypt.hash(password, 10);

  await new User({ email, password: hashed, isAdmin: true }).save();

  res.json({ success: true, message: "Admin created" });
});

/* ------------------------------------------------------
   PRODUCTS — ADD PRODUCT
------------------------------------------------------ */
app.post("/api/admin/products", async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.json({ success: true, product: p });
  } catch (_) {
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
  } catch (_) {
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
  } catch (_) {
    res.json({ success: false });
  }
});

/* ------------------------------------------------------
   ORDERS — USER HISTORY
------------------------------------------------------ */
app.get("/api/orders/history/:email", async (req, res) => {
  res.json(await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 }));
});

/* ------------------------------------------------------
   FRONTEND (Render fallback)
------------------------------------------------------ */
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ------------------------------------------------------
   START SERVER
------------------------------------------------------ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
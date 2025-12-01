// ------------------------------------------------------
// SUITS N GLAM — FULL BACKEND (MERGED INTO ONE FILE)
// Google Login Compatible + Email/Password Fallback
// ------------------------------------------------------

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

// ------------------------------------------------------
// DATABASE
// ------------------------------------------------------
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/suitsnglam";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// ------------------------------------------------------
// SCHEMAS / MODELS
// ------------------------------------------------------
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  password: String, // hashed
  picture: String,
  createdAt: Date,
});
const User = mongoose.model("User", UserSchema);

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  description: String,
  stock: Number,
  images: [String],
  video: String,
  sale: Number,
  createdAt: Date,
});
const Product = mongoose.model("Product", ProductSchema);

// ------------------------------------------------------
// MIDDLEWARE
// ------------------------------------------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------
// GOOGLE-SAFE ROUTES (Prevent index.html override)
// ------------------------------------------------------
const googleSafe = [
  "/.well-known",
  "/_",
  "/gsi",
  "/google",
  "/oauth2",
  "/signin",
  "/auth",
];

app.use((req, res, next) => {
  if (googleSafe.some((p) => req.path.startsWith(p))) return next();
  next();
});

// ------------------------------------------------------
// EMAIL AUTH — REGISTER
// ------------------------------------------------------
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
      createdAt: new Date(),
    });

    await newUser.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    return res.json({ success: false, message: "Server error" });
  }
});

// ------------------------------------------------------
// EMAIL AUTH — LOGIN
// ------------------------------------------------------
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
      return res.json({
        success: false,
        message: "Incorrect password",
      });

    return res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture || "/images/default-user.png",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.json({ success: false, message: "Server error" });
  }
});

// ------------------------------------------------------
// ADMIN — ADD PRODUCT
// ------------------------------------------------------
app.post("/api/admin/products", async (req, res) => {
  try {
    const { name, price, category, description, stock, images, video, sale } =
      req.body;

    if (!name || !price || !category)
      return res.json({ success: false, message: "Missing fields" });

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
    console.error("Add product error:", err);
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
    console.error("Delete product error:", err);
    res.json({ success: false, message: "Delete failed" });
  }
});

// ------------------------------------------------------
// PRODUCTS — ALL
// ------------------------------------------------------
app.get("/api/products/category/all", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// ------------------------------------------------------
// PRODUCTS — BY CATEGORY
// ------------------------------------------------------
app.get("/api/products/category/:cat", async (req, res) => {
  const products = await Product.find({ category: req.params.cat }).sort({
    createdAt: -1,
  });
  res.json(products);
});

// ------------------------------------------------------
// PRODUCTS — SINGLE
// ------------------------------------------------------
app.get("/api/products/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  res.json(p);
});

// ------------------------------------------------------
// FRONTEND ROUTES
// ------------------------------------------------------
const pages = [
  "/",
  "/index.html",
  "/allproducts.html",
  "/newarrivals.html",
  "/summer.html",
  "/winter.html",
  "/wedding.html",
  "/casuals.html",
  "/dailywear.html",
  "/premiumwear.html",
  "/bestdeals.html",
  "/sales.html",
  "/cart.html",
  "/product.html",
  "/account.html",
  "/admin.html",
  "/admin-orders.html",
  "/orderhistory.html",
  "/ordertracking.html",
  "/checkout.html",
  "/success.html",
];

pages.forEach((route) => {
  app.get(route, (req, res) =>
    res.sendFile(path.join(__dirname, "public", "index.html"))
  );
});

// ------------------------------------------------------
// START SERVER
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`🚀 Suits N Glam Backend Running on port ${PORT}`)
);
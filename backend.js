// SUITS N GLAM — FULL BACKEND (CLEANED, FIXED, JWT, ORDERS, RATE-LIMIT)
require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();

/* ------------------ CONFIG ------------------ */
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/suitsnglam";
const JWT_SECRET = process.env.JWT_SECRET || "replace_this_with_a_strong_secret";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "sohabrar10@gmail.com").split(",");
const DEFAULTS = {
  userPicture: "/images/default-user.png",
  productImage: "/images/default-product.png",
  currencySymbol: "₹",
};

/* ------------------ SECURITY / RATE LIMIT ------------------ */
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

/* ------------------ DATABASE ------------------ */
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

/* ------------------ SCHEMAS / MODELS ------------------ */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  password: String, // hashed
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

/* ------------------ HELPERS ------------------ */
function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

function createToken(user) {
  return jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return sendJson(res, 401, { success: false, message: "Missing auth" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return sendJson(res, 401, { success: false, message: "Invalid auth format" });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return sendJson(res, 401, { success: false, message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  const email = req.user?.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return sendJson(res, 403, { success: false, message: "Admin only" });
  }
  return next();
}

/* ------------------ API: AUTH ------------------ */

/**
 * Register — email/password
 * returns { success: true } on success
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return sendJson(res, 400, { success: false, message: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return sendJson(res, 409, { success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name: name || email.split("@")[0],
      email,
      password: hashed,
      picture: DEFAULTS.userPicture,
    });

    await user.save();
    return sendJson(res, 201, { success: true });
  } catch (err) {
    console.error("Register error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/**
 * Login — email/password
 * returns { success:true, token, user }
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendJson(res, 400, { success: false, message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return sendJson(res, 404, { success: false, message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return sendJson(res, 401, { success: false, message: "Incorrect password" });

    const token = createToken(user);
    return sendJson(res, 200, {
      success: true,
      token,
      user: { email: user.email, name: user.name, picture: user.picture || DEFAULTS.userPicture },
    });
  } catch (err) {
    console.error("Login error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/**
 * Google-safe upsert:
 * Accepts { email, name, picture } (you should verify on client side)
 * Creates or updates a user and returns a JWT token + user info
 */
app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, name, picture } = req.body;
    if (!email) return sendJson(res, 400, { success: false, message: "Missing email" });

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { name: name || email.split("@")[0], picture: picture || DEFAULTS.userPicture } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = createToken(user);
    return sendJson(res, 200, {
      success: true,
      token,
      user: { email: user.email, name: user.name, picture: user.picture || DEFAULTS.userPicture },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/* ------------------ API: PRODUCTS ------------------ */

/**
 * Create product (admin)
 */
app.post("/api/admin/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, price, category, description, stock, images, video, sale } = req.body;
    if (!name || price == null || !category) return sendJson(res, 400, { success: false, message: "Missing fields" });

    const p = new Product({ name, price, category, description, stock, images, video, sale });
    await p.save();
    return sendJson(res, 201, { success: true, product: p });
  } catch (err) {
    console.error("Add product error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/**
 * Delete product (admin)
 */
app.delete("/api/admin/products/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return sendJson(res, 200, { success: true });
  } catch (err) {
    console.error("Delete product error:", err);
    return sendJson(res, 500, { success: false, message: "Delete failed" });
  }
});

/**
 * List all products (public)
 */
app.get("/api/products/category/all", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return sendJson(res, 200, products);
  } catch (err) {
    console.error("Products error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/**
 * Products by category (public)
 */
app.get("/api/products/category/:cat", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.cat }).sort({ createdAt: -1 });
    return sendJson(res, 200, products);
  } catch (err) {
    console.error("Products by cat error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/**
 * Single product
 */
app.get("/api/products/:id", async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return sendJson(res, 404, { success: false, message: "Not found" });
    return sendJson(res, 200, p);
  } catch (err) {
    console.error("Single product error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/* ------------------ API: ORDERS ------------------ */

/**
 * Create order (authenticated users)
 * payload: { items: [...], total: Number, meta?:{} }
 */
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const { items, total, meta } = req.body;
    if (!Array.isArray(items) || items.length === 0) return sendJson(res, 400, { success: false, message: "No items" });
    const order = new Order({
      userEmail: req.user.email,
      items,
      total: Number(total) || 0,
      meta: meta || {},
    });
    await order.save();
    return sendJson(res, 201, { success: true, order });
  } catch (err) {
    console.error("Create order error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/**
 * Get orders for a user (authenticated)
 */
app.get("/api/orders/:email", requireAuth, async (req, res) => {
  try {
    const email = req.params.email;
    // Allow admins to fetch anyone's orders; users only their own
    if (req.user.email !== email && !ADMIN_EMAILS.includes(req.user.email)) {
      return sendJson(res, 403, { success: false, message: "Forbidden" });
    }
    const orders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });
    return sendJson(res, 200, orders);
  } catch (err) {
    console.error("Get orders error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/**
 * Admin: list all orders
 */
app.get("/api/admin/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return sendJson(res, 200, orders);
  } catch (err) {
    console.error("Admin orders error:", err);
    return sendJson(res, 500, { success: false, message: "Server error" });
  }
});

/* ------------------ STATIC FRONTEND (FIXED) ------------------ */
app.use(express.static(path.join(__dirname, "public")));

/* Serve index.html for non-API routes only */
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ------------------ START SERVER (single listener) ------------------ */
app.listen(PORT, () => {
  console.log(`🚀 Suits N Glam Backend Running on port ${PORT}`);
});


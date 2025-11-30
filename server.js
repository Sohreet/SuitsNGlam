require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/products");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded images/videos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/products", productRoutes);

// ❌ REMOVE catch-all — NOT needed for HTML website
// app.get("*", ...)

// Connect DB + Start Server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server running on port " + PORT));
  })
  .catch(err => console.log("DB Error:", err.message));

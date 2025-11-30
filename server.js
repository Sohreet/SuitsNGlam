require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/products");

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images and videos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/products", productRoutes);

// Health check
app.get("/", (req, res) => res.send({ ok: true }));

// Connect DB + Start Server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server running on port", PORT));
  })
  .catch(err => console.log("DB Error:", err.message));

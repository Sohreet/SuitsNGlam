import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import productsRoute from "./routes/products.js";
import userRoutes from "./routes/userRoutes.js";
import ordersRoute from "./routes/orders.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Needed for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 Serve Frontend (public folder)
app.use(express.static(path.join(__dirname, "public")));

// 🔥 Backend API Routes
app.use("/api/products", productsRoute);
app.use("/api/users", userRoutes);
app.use("/api/orders", ordersRoute);

// 🔥 Fallback – return index.html for anything not API
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

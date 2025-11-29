// backend_deploy/routes/orders.js
import express from "express";
import { 
  createOrder, 
  getOrders, 
  getAllOrders, 
  updateOrderStatus 
} from "../controllers/orderController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// USER — Create + View own orders
router.post("/", auth, createOrder);
router.get("/", auth, getOrders);

// ADMIN — View all orders + Update status
router.get("/admin/all", auth, getAllOrders);
router.put("/:id", auth, updateOrderStatus);

export default router;

// backend_deploy/controllers/orderController.js
import Order from "../models/Order.js";

// CREATE ORDER
export async function createOrder(req, res) {
  try {
    const order = await Order.create(req.body);
    res.json(order);
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    res.status(500).json({ error: "Create Order Failed" });
  }
}

// USER'S ORDERS
export async function getOrders(req, res) {
  try {
    const orders = await Order.find({ userEmail: req.user.email })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Fetch Orders Failed" });
  }
}

// ADMIN — ALL ORDERS
export async function getAllOrders(req, res) {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Fetch All Orders Failed" });
  }
}

// UPDATE ORDER STATUS (ADMIN)
export async function updateOrderStatus(req, res) {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update Status Failed" });
  }
}

import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: Array,
  amount: Number,
  payment: Object,
  shipping: Object,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", OrderSchema);

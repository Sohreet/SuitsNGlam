import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({ message: "Only Gmail accounts allowed ❌" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists ❌" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash: hash,
      isAdmin: email === process.env.ADMIN_EMAIL
    });

    res.status(201).json({ message: "Account created successfully ✅" });

  } catch (err) {
    res.status(500).json({ message: "Server error ❌" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({ message: "Only Gmail accounts can login ❌" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password ❌" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Invalid email or password ❌" });

    const token = generateToken(user);

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch {
    res.status(500).json({ message: "Server error ❌" });
  }
});

export default router;

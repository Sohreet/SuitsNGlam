import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/suitsnglam";

mongoose
  .connect(MONGO)
  .then(() => create())
  .catch((e) => console.error(e));

async function create() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: node utils/createAdmin.js email password");
    process.exit(1);
  }

  const [email, password] = args;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const u = new User({
    email,
    passwordHash: hash,
    isAdmin: true,
  });

  await u.save();

  console.log("Admin created:", email);
  process.exit(0);
}

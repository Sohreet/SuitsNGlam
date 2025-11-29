import express from "express";
import * as ctrl from "../controllers/productController.js";
import auth from "../middleware/auth.js";

import { uploadImages } from "../middleware/upload.js";

const router = express.Router();

// GET products
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);

// POST create
router.post(
  "/",
  auth,
  uploadImages.fields([{ name: "images", maxCount: 5 }, { name: "video", maxCount: 1 }]),
  ctrl.create
);

// UPDATE
router.put(
  "/:id",
  auth,
  uploadImages.fields([{ name: "images", maxCount: 5 }, { name: "video", maxCount: 1 }]),
  ctrl.update
);

// DELETE
router.delete("/:id", auth, ctrl.remove);

export default router;

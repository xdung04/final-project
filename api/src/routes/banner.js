// routes/bannerRouter.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import * as bannerController from "../controllers/bannerController.js";
import { upload } from "../controllers/bannerController.js";

const router = express.Router();

// Public - Lấy banner cho Home
router.get("/", bannerController.getActiveBanners);

// Admin - Tạo banner
router.post(
  "/",
  authenticate,
  upload.single("image"),
  bannerController.createBanner
);

export default router;
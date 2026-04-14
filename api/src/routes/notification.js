// routes/notificationRouter.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import * as notificationController from "../controllers/notificationController.js";

const router = express.Router();

// Lấy thông báo cho header
router.get("/", authenticate, notificationController.getMyNotifications);

// Đánh dấu đã đọc
router.put("/:id/read", authenticate, notificationController.markAsRead);

export default router;
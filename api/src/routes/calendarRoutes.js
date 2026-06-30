import express from "express";
import * as calendarController from "../controllers/googleCalendarController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả route cần xác thực (trừ callback, nhưng callback dùng query state)
router.get("/google/link", authenticate, calendarController.initiateGoogleLink);
router.get("/google/callback", calendarController.googleCallback); // không cần auth vì dùng state
router.get("/status", authenticate, calendarController.getLinkStatus);
router.delete("/unlink", authenticate, calendarController.unlinkCalendar);
router.post("/test-event", authenticate, calendarController.addTestEvent);

export default router;
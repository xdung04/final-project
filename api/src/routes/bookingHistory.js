// routes/bookingHistory.js
import express from "express";
import BookingHistoryController from "../controllers/bookingHistoryController.js";
import { authenticate } from "../middlewares/authMiddleware.js"; // import đúng middleware

const router = express.Router();

// GET /booking-history  -> token xác định idCustomer
router.get("/", authenticate, BookingHistoryController.getBookingHistory);

export default router;

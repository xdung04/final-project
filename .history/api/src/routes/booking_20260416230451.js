import express from "express";
import {
  getBranches,
  getBranchDetails,
  createBooking,
  completeBooking,
  getBookingsByBarber,
  upload,
  getAllBookingDetails,
  cancelBooking,
  getBookingsForBarber,
  getBookedSlotsByBarber,
    checkInBooking,
} from "../controllers/bookingController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🧾 Lấy tất cả chi nhánh
router.get("/branches", getBranches);

// 🧩 Lấy chi tiết 1 chi nhánh
router.get("/branches/:idBranch", getBranchDetails);

// 🧑‍💼 Booking theo barber
router.get("/barbers/:idBarber", getBookingsByBarber);

// 📋 Danh sách booking admin
router.get("/details", getAllBookingDetails);

// ❌ Hủy booking
router.put("/:idBooking/cancel", cancelBooking);
router.put("/:idBooking/checkin", checkInBooking);

router.get("/barber", getBookingsForBarber);
router.get("/barbers/:idBarber/booked-slots", getBookedSlotsByBarber);

// ✅ Hoàn tất booking (upload ảnh)
router.post(
  "/:id/complete",
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "left", maxCount: 1 },
    { name: "right", maxCount: 1 },
    { name: "back", maxCount: 1 },
  ]),
  completeBooking
);

// ✍️ Tạo booking mới
router.post("/create",authenticate, createBooking);

export default router;

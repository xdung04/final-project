import express from "express";
import {
  getBranches,
  getBranchDetails,
  createBooking,
  completeBooking,
  upload,
  cancelBooking,
  getBookingsForBarber,
  getBookedSlotsByBarber,
  checkInBooking,
  getBookingsByBranch,
} from "../controllers/bookingController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

const receptionistOnly = authorize(["receptionist"]);
const barberOnly        = authorize(["barber"]);
const staffOnly         = authorize(["receptionist", "barber", "admin"]);
router.get("/branches",             getBranches);
router.get("/branches/:idBranch",   getBranchDetails);

router.get("/barbers/:idBarber/booked-slots", getBookedSlotsByBarber);

// ═══════════════════════════════════════════════════════════════════════════
// 2. CUSTOMER — đăng nhập là được
// ═══════════════════════════════════════════════════════════════════════════
router.post("/create", authenticate, createBooking);

// ═══════════════════════════════════════════════════════════════════════════
// 3. RECEPTIONIST
// ═══════════════════════════════════════════════════════════════════════════
router.get ("/branch/:idBranch",      authenticate, receptionistOnly, getBookingsByBranch);
router.put ("/:idBooking/checkin",    authenticate, receptionistOnly, checkInBooking);
router.put ("/:idBooking/cancel",     authenticate, receptionistOnly, cancelBooking);

// ═══════════════════════════════════════════════════════════════════════════
// 4. BARBER
// ═══════════════════════════════════════════════════════════════════════════
router.get("/barber",                 authenticate, barberOnly, getBookingsForBarber);

router.post(
  "/:id/complete",
  authenticate,
  barberOnly,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "left",  maxCount: 1 },
    { name: "right", maxCount: 1 },
    { name: "back",  maxCount: 1 },
  ]),
  completeBooking
);

export default router;
import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import * as barberDayOffController from "../controllers/barberDayOffController.js";

const router = express.Router();
const adminOnly = authorize(["admin"]);


router.get("/",
  authenticate, adminOnly,
  barberDayOffController.getAll
);
router.post("/preview",
  authenticate, adminOnly,
  barberDayOffController.preview
);

// POST   /api/barber-day-offs          — tạo lịch nghỉ + hủy booking
router.post("/",
  authenticate, adminOnly,
  barberDayOffController.create
);

// PUT    /api/barber-day-offs/:id      — sửa lịch nghỉ + hủy booking mới nếu có
router.put("/:id",
  authenticate, adminOnly,
  barberDayOffController.update
);

// DELETE /api/barber-day-offs/:id      — xóa lịch nghỉ, mở lại slot
router.delete("/:id",
  authenticate, adminOnly,
  barberDayOffController.remove
);

export default router;
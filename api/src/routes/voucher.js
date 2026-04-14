import express from "express";
import voucherController from "../controllers/voucherController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// --- CRUD voucher (admin) ---
router.post("/", voucherController.create);
router.get("/", voucherController.getAll);

// --- Voucher khách (cần authenticate) ---
router.get("/customer/me", authenticate, voucherController.getCustomerVouchers);
router.get("/available", authenticate, voucherController.getAvailableVouchersByPoint);
router.post("/exchange", authenticate, voucherController.exchangeVoucher);

// --- Route động ở cuối cùng ---
router.get("/:id", voucherController.getById);
router.put("/:id", voucherController.update);
router.delete("/:id", voucherController.delete);

export default router;

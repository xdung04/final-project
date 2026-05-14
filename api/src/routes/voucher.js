import express from "express";
import voucherController from "../controllers/voucherController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// --- Admin routes ---
router.post("/", authenticate, voucherController.create);
router.get("/", authenticate, voucherController.getAll);
router.get("/stats/:id", authenticate, voucherController.getVoucherStats);
router.post("/retention/issue", authenticate, voucherController.issueRetentionVouchers);
router.put("/:id", authenticate, voucherController.update);
router.delete("/:id", authenticate, voucherController.delete);
router.get("/:id", authenticate, voucherController.getById);

// --- Customer routes (cần authenticate) ---
router.get("/customer/available", authenticate, voucherController.getCustomerAvailableVouchers);
router.get("/customer/history", authenticate, voucherController.getCustomerVoucherHistory);
router.get("/customer/exchangeable", authenticate, voucherController.getExchangeableVouchers);
router.get("/customer/campaigns", authenticate, voucherController.getActiveCampaigns);
router.post("/customer/exchange", authenticate, voucherController.exchangeVoucher);
router.post("/customer/collect", authenticate, voucherController.collectCampaignVoucher);
router.get("/customer/points", authenticate, voucherController.getCustomerPoints);
// router.post("/customer/apply", authenticate, voucherController.applyVoucher); // có thể dùng riêng

export default router;
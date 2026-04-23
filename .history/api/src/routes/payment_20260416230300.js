// routes/payment.js
import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import { authenticate } from "../middlewares/authMiddleware.js"; // Thêm cái này nếu cần

const router = express.Router();

// Nếu iPad Kiosk dùng chung Token thì nên thêm authenticate vào đây
router.post("/:idBooking/pay", paymentController.createPayment);

// RIÊNG IPN thì KHÔNG ĐƯỢC thêm authenticate, vì VNPAY gọi server-to-server, nó không có token của ông đâu
router.get("/vnpay_ipn", paymentController.vnpayIPN); 

export default router;
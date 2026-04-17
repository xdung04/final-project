// routes/payment.js
import express from "express";
import * as paymentController from "../controllers/paymentController.js";

const router = express.Router();

/**
 * @route   POST /api/payment/:idBooking/create
 * @desc    Tạo yêu cầu thanh toán (CASH hoặc VNPAY)
 * @access  Public (iPad Kiosk)
 */
router.post("/:idBooking/create", paymentController.createPayment);

/**
 * @route   GET /api/payment/vnpay_ipn
 * @desc    VNPAY gọi ngầm để cập nhật trạng thái đơn hàng (IPN)
 * @access  Private (Chỉ VNPAY gọi)
 */
router.get("/vnpay_ipn", paymentController.vnpayIPN);

// Nếu ông có trang kết quả thanh toán trên Web/App có thể thêm route Return
// router.get("/vnpay_return", paymentController.vnpayReturn);

export default router;
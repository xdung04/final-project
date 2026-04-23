// controllers/paymentController.js
import db from "../models/index.js";
import * as paymentService from "../services/paymentService.js";
import * as vnpayService from "../services/vnpayService.js"; // Giả định ông có file này để tạo URL

const { sequelize } = db;

/**
 * Xử lý yêu cầu thanh toán tổng quát từ Kiosk/iPad
 */
export const createPayment = async (req, res) => {
  const { idBooking } = req.params;
  const { method, total, tip, services } = req.body;

  // 1. Nếu khách chọn Thanh toán tiền mặt (CASH)
  if (method === "CASH") {
    const t = await sequelize.transaction();
    try {
      const result = await paymentService.finalizePayment(idBooking, { total, tip, services }, t);
      
      await t.commit();

      // Bắn Socket báo cho Monitor Lễ tân (nếu ông đã setup io)
      // req.io.emit("PAYMENT_SUCCESS", { idBooking, method: "CASH" });

      return res.status(200).json({
        success: true,
        message: "Thanh toán tiền mặt thành công 🎉",
        data: result,
      });
    } catch (error) {
      await t.rollback();
      return res.status(500).json({ 
        success: false, 
        message: error.message === "BOOKING_ALREADY_PAID" ? "Lịch hẹn đã thanh toán rồi" : "Lỗi xử lý thanh toán tiền mặt" 
      });
    }
  }

  // 2. Nếu khách chọn Chuyển khoản (VNPAY)
  if (method === "VNPAY") {
    try {
      // Gọi service tạo URL thanh toán (Không mở transaction ở đây vì chưa update DB)
      const paymentUrl = await vnpayService.createPaymentUrl({
        idBooking,
        amount: total,
        // Lưu tip và services vào vnp_OrderInfo hoặc Database tạm để IPN lấy lại
      });

      return res.status(200).json({
        success: true,
        message: "Khởi tạo link VNPAY thành công",
        paymentUrl: paymentUrl,
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: "Không thể khởi tạo cổng VNPAY", 
        error: error.message 
      });
    }
  }

  return res.status(400).json({ success: false, message: "Phương thức thanh toán không hợp lệ" });
};

/**
 * Xử lý kết quả trả về từ VNPAY (IPN)
 * VNPAY sẽ gọi ngầm định vào API này
 */
export const vnpayIPN = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const isValid = vnpayService.verifyReturnData(req.query);
    if (!isValid) {
      return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
    }

    const { vnp_ResponseCode, vnp_TxnRef, vnp_Amount } = req.query;
    const idBooking = vnp_TxnRef.split("_")[0]; // Lấy lại ID từ chuỗi TxnRef

    if (vnp_ResponseCode === "00") {
      await paymentService.finalizePayment(idBooking, { total: vnp_Amount / 100 }, t);
      
      await t.commit();
      
      // Bắn Socket báo cho Monitor Lễ tân
      // req.io.emit("PAYMENT_SUCCESS", { idBooking, method: "VNPAY" });

      return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
    } else {
      await t.rollback();
      return res.status(200).json({ RspCode: "01", Message: "Payment Failed" });
    }
  } catch (error) {
    if (t) await t.rollback();
    return res.status(200).json({ RspCode: "99", Message: "Unknown Error" });
  }
};
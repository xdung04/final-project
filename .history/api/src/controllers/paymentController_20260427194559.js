// controllers/paymentController.js
import db from "../models/index.js";
import * as paymentService from "../services/paymentService.js";
import * as vnpayService from "../services/vnpayService.js"; 
import NodeCache from "node-cache";

const { sequelize, Booking } = db;

// Khởi tạo cache sống trong 15 phút (900 giây) để chờ khách thanh toán VNPAY
const paymentCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

/**
 * Xử lý yêu cầu thanh toán tổng quát từ Kiosk/iPad
 */
export const createPayment = async (req, res) => {
  const { idBooking } = req.params;
  const { method, total, tip, rating, services } = req.body; // Đảm bảo FE có gửi rating nếu có

  // 1. Nếu khách chọn Thanh toán tiền mặt (CASH)
  if (method === "CASH") {
    const t = await sequelize.transaction();
    try {
      const result = await paymentService.finalizePayment(
        idBooking, 
        { tip, rating, services, paymentMethod: "Cash" }, 
        t
      );
      
      await t.commit();

      // Bắn Socket báo cho Monitor Lễ tân (nếu có)
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
      // 👉 LƯU TẠM DATA VÀO RAM (CACHE) VỚI CHÌA KHÓA LÀ idBooking
      paymentCache.set(`vnpay_data_${idBooking}`, { services, tip, rating });

      // Gọi service tạo URL thanh toán 
      const paymentUrl = await vnpayService.createPaymentUrl({
        idBooking,
        amount: total,
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
 * Xử lý khi khách quét xong và VNPAY redirect khách về lại web của mình
 */
export const vnpayReturn = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const vnp_Params = req.query;
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const vnp_TxnRef = vnp_Params['vnp_TxnRef'];
    const idBooking = vnp_TxnRef.split("_")[0];

    const isValid = vnpayService.verifyReturnData(vnp_Params);
    
    if (isValid && responseCode === "00") {
      // Kiểm tra xem đơn này IPN đã xử lý trước đó chưa
      const booking = await Booking.findByPk(idBooking, { transaction: t });
      if (!booking || booking.isPaid) {
        await t.rollback();
        return res.redirect(`http://localhost:3000/kiosk?vnp_ResponseCode=00`); // Đã thanh toán rồi thì cứ cho về trang thành công
      }

      // 👉 LẤY LẠI DATA ĐÃ LƯU TRONG CACHE RA
      const pendingData = paymentCache.get(`vnpay_data_${idBooking}`) || {};

      // Gọi finalizePayment với đầy đủ data
      await paymentService.finalizePayment(idBooking, { 
        services: pendingData.services,
        tip: pendingData.tip,
        rating: pendingData.rating,
        paymentMethod: "Transfer" 
      }, t);
      
      await t.commit();

      // 👉 XÓA DATA TRONG CACHE CHO SẠCH RAM
      paymentCache.del(`vnpay_data_${idBooking}`);

      // BẮN SOCKET BÁO LỄ TÂN CẬP NHẬT MÀN HÌNH
      if (req.io) {
        req.io.emit("receive_customer_progress", {
          bookingId: idBooking,
          step: 5, 
          isPaid: true,
          method: "VNPAY",
          message: `Booking #${idBooking} đã thanh toán xong!`
        });
        req.io.emit("PAYMENT_SUCCESS_AD", { idBooking });
      }

      return res.redirect(`http://localhost:3000/kiosk?vnp_ResponseCode=00`);
    } else {
      await t.rollback();
      return res.redirect(`http://localhost:3000/kiosk?vnp_ResponseCode=error`);
    }
  } catch (error) {
    if (t) await t.rollback();
    return res.redirect(`http://localhost:3000/kiosk?error=system`);
  }
};

/**
 * Xử lý kết quả trả về từ VNPAY (IPN) - Chạy ngầm
 */
export const vnpayIPN = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const isValid = vnpayService.verifyReturnData(req.query);
    if (!isValid) {
      return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
    }

    const { vnp_ResponseCode, vnp_TxnRef } = req.query;
    const idBooking = vnp_TxnRef.split("_")[0]; 

    if (vnp_ResponseCode === "00") {
      const booking = await Booking.findByPk(idBooking, { transaction: t });
      
      // Chuẩn VNPAY: Nếu đơn đã thanh toán rồi thì trả về mã 02
      if (!booking || booking.isPaid) {
        await t.rollback();
        return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
      }

      // 👉 LẤY LẠI DATA ĐÃ LƯU TRONG CACHE RA
      const pendingData = paymentCache.get(`vnpay_data_${idBooking}`) || {};

      // Gọi finalizePayment với đầy đủ data
      await paymentService.finalizePayment(idBooking, { 
        services: pendingData.services,
        tip: pendingData.tip,
        rating: pendingData.rating,
        paymentMethod: "Transfer" 
      }, t);
      
      await t.commit();
      
      // 👉 XÓA DATA TRONG CACHE CHO SẠCH RAM
      paymentCache.del(`vnpay_data_${idBooking}`);

      // Bắn Socket báo cho Monitor Lễ tân (tùy chọn)
      if (req.io) {
        req.io.emit("PAYMENT_SUCCESS_AD", { idBooking });
      }

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
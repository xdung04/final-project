// controllers/paymentController.js
import db from "../models/index.js";
import * as paymentService from "../services/paymentService.js";
import * as vnpayService from "../services/vnpayService.js";
import NodeCache from "node-cache";

const { sequelize, Booking } = db;

const paymentCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

export const createPayment = async (req, res) => {
  const { idBooking } = req.params;
  const { method, total, tip, rating, services, totalPaid, totalServicePrice, voucherReverted, customerVoucherId } = req.body;

  if (method === "CASH") {
    const t = await sequelize.transaction();
    try {
      const result = await paymentService.finalizePayment(
        idBooking,
        { tip, rating, services, paymentMethod: "Cash", total ,totalServicePrice, voucherReverted, customerVoucherId},
        t
      );
      await t.commit();

      // ✅ FIX BUG 1: Bỏ comment, bắn socket báo lễ tân khi CASH thành công
      if (req.io) {
        req.io.emit("receive_customer_progress", {
          bookingId: idBooking,
          step: 5,
          isPaid: true,
          method: "CASH",
          message: `Booking #${idBooking} đã thanh toán tiền mặt xong!`,
        });
        req.io.emit("PAYMENT_SUCCESS_AD", { idBooking });
      }

      return res.status(200).json({
        success: true,
        message: "Thanh toán tiền mặt thành công 🎉",
        data: result,
      });
    } catch (error) {
      await t.rollback();
      return res.status(500).json({
        success: false,
        message:
          error.message === "BOOKING_ALREADY_PAID"
            ? "Lịch hẹn đã thanh toán rồi"
            : "Lỗi xử lý thanh toán tiền mặt",
      });
    }
  }

  if (method === "VNPAY") {
    try {
      // ✅ FIX BUG 2: Validate trước khi cache — nếu thiếu services thì báo lỗi sớm
      if (!Array.isArray(services) || services.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Thiếu danh sách dịch vụ để thanh toán VNPAY",
        });
      }

      paymentCache.set(`vnpay_data_${idBooking}`, { services, tip, rating });

      const paymentUrl = await vnpayService.createPaymentUrl({
        idBooking,
        amount: totalPaid, 
      });

      return res.status(200).json({
        success: true,
        message: "Khởi tạo link VNPAY thành công",
        paymentUrl,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Không thể khởi tạo cổng VNPAY",
        error: error.message,
      });
    }
  }

  return res.status(400).json({ success: false, message: "Phương thức thanh toán không hợp lệ" });
};

export const vnpayReturn = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const vnp_Params = req.query;
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const vnp_TxnRef = vnp_Params["vnp_TxnRef"];
    const idBooking = vnp_TxnRef.split("_")[0];

    const isValid = vnpayService.verifyReturnData(vnp_Params);

    if (isValid && responseCode === "00") {
      const booking = await Booking.findByPk(idBooking, { transaction: t });

      if (!booking) {
        await t.rollback();
        return res.redirect(`http://localhost:3000/kiosk?vnp_ResponseCode=error`);
      }

      if (booking.isPaid) {
        // ✅ FIX BUG 3: IPN đã xử lý trước → vẫn phải bắn socket để lễ tân cập nhật màn hình
        await t.rollback();
        if (req.io) {
          req.io.emit("receive_customer_progress", {
            bookingId: idBooking,
            step: 5,
            isPaid: true,
            method: "VNPAY",
            message: `Booking #${idBooking} đã thanh toán xong!`,
          });
          req.io.emit("PAYMENT_SUCCESS_AD", { idBooking });
        }
        return res.redirect(`http://localhost:3000/kiosk?vnp_ResponseCode=00`);
      }

      // ✅ FIX BUG 4: Kiểm tra cache có data không — nếu miss thì rollback, không xử lý bừa
      const pendingData = paymentCache.get(`vnpay_data_${idBooking}`);
      if (!pendingData || !Array.isArray(pendingData.services) || pendingData.services.length === 0) {
        await t.rollback();
        console.error(`[vnpayReturn] Cache miss cho booking ${idBooking} — không thể finalize`);
        return res.redirect(`http://localhost:3000/kiosk?vnp_ResponseCode=error&reason=cache_miss`);
      }

      await paymentService.finalizePayment(
        idBooking,
        {
          services: pendingData.services,
          tip: pendingData.tip,
          rating: pendingData.rating,
          paymentMethod: "Transfer",
        },
        t
      );

      await t.commit();
      paymentCache.del(`vnpay_data_${idBooking}`);

      if (req.io) {
        req.io.emit("receive_customer_progress", {
          bookingId: idBooking,
          step: 5,
          isPaid: true,
          method: "VNPAY",
          message: `Booking #${idBooking} đã thanh toán xong!`,
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
    console.error("[vnpayReturn] Error:", error);
    return res.redirect(`http://localhost:3000/kiosk?error=system`);
  }
};

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

      if (!booking || booking.isPaid) {
        await t.rollback();
        return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
      }

      // ✅ FIX BUG 4 (IPN): Tương tự Return — validate cache trước
      const pendingData = paymentCache.get(`vnpay_data_${idBooking}`);
      if (!pendingData || !Array.isArray(pendingData.services) || pendingData.services.length === 0) {
        await t.rollback();
        console.error(`[vnpayIPN] Cache miss cho booking ${idBooking}`);
        return res.status(200).json({ RspCode: "99", Message: "Cache expired or missing" });
      }

      await paymentService.finalizePayment(
        idBooking,
        {
          services: pendingData.services,
          tip: pendingData.tip,
          rating: pendingData.rating,
          paymentMethod: "Transfer",
        },
        t
      );

      await t.commit();
      paymentCache.del(`vnpay_data_${idBooking}`);

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
    console.error("[vnpayIPN] Error:", error);
    return res.status(200).json({ RspCode: "99", Message: "Unknown Error" });
  }
};
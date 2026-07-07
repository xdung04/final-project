// controllers/paymentController.js
import db from "../models/index.js";
import * as paymentService from "../services/paymentService.js";
import * as vnpayService from "../services/vnpayService.js";
import NodeCache from "node-cache";

const { sequelize, Booking } = db;

const paymentCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

// ✅ Lấy từ .env, fallback về localhost nếu không set
// Khi test trên iPad/thiết bị khác, chỉ cần đổi FRONTEND_URL trong .env rồi restart server
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const createPayment = async (req, res) => {
  const { idBooking } = req.params;
  const { method, total, tip, rating, services, totalPaid, totalServicePrice, voucherReverted, customerVoucherId } = req.body;

  if (method === "CASH") {
    const t = await sequelize.transaction();
    try {
      const result = await paymentService.finalizePayment(
        idBooking,
        { tip, rating, services, paymentMethod: "Cash", total, totalServicePrice, voucherReverted, customerVoucherId },
        t
      );
      await t.commit();

      if (req.io) {
        req.io.emit("receive_customer_progress", {
          bookingId: idBooking,
          step: 6,
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
    console.log("[vnpayReturn] raw query:", JSON.stringify(vnp_Params));

    const responseCode = vnp_Params["vnp_ResponseCode"];
    const vnp_TxnRef = vnp_Params["vnp_TxnRef"];

    // ✅ Guard: thiếu TxnRef
    if (!vnp_TxnRef) {
      await t.rollback();
      console.error("[vnpayReturn] Thiếu vnp_TxnRef");
      return res.redirect(`${FRONTEND_URL}/kiosk?vnp_ResponseCode=error&reason=missing_txnref`);
    }

    // ✅ Fix: dùng "-" vì TxnRef format là "81870-20260626103806"
    const idBooking = vnp_TxnRef.split("-")[0];
    console.log(`[vnpayReturn] idBooking: ${idBooking}, responseCode: ${responseCode}`);

    const isValid = vnpayService.verifyReturnData(vnp_Params);

    if (isValid && responseCode === "00") {
      // ✅ Fix: lấy idBranch qua barber (Booking không có association trực tiếp với Branch)
      const booking = await Booking.findByPk(idBooking, {
        transaction: t,
        include: [
          { association: "barber", attributes: ["idBarber", "idBranch"] }
        ]
      });

      if (!booking) {
        await t.rollback();
        return res.redirect(`${FRONTEND_URL}/kiosk?vnp_ResponseCode=error&reason=not_found`);
      }

      const idBranch = booking.barber?.idBranch;
      console.log(`[vnpayReturn] idBooking: ${idBooking}, idBranch: ${idBranch}`);

      if (booking.isPaid) {
        await t.rollback();
        if (req.io && idBranch) {
          req.io.to(`checkout_branch_${idBranch}`).emit("receive_customer_progress", {
            idBranch,
            bookingId: idBooking,
            step: 5,
            isPaid: true,
            method: "VNPAY",
            message: `Booking #${idBooking} đã thanh toán xong!`,
          });
          req.io.to(`checkout_branch_${idBranch}`).emit("PAYMENT_SUCCESS_AD", {
            idBranch,
            idBooking
          });
        }
        return res.redirect(`${FRONTEND_URL}/kiosk?vnp_ResponseCode=00&idBranch=${idBranch}`);
      }

      const pendingData = paymentCache.get(`vnpay_data_${idBooking}`);
      if (!pendingData || !Array.isArray(pendingData.services) || pendingData.services.length === 0) {
        await t.rollback();
        console.error(`[vnpayReturn] Cache miss cho booking ${idBooking}`);
        return res.redirect(`${FRONTEND_URL}/kiosk?vnp_ResponseCode=error&reason=cache_miss&idBranch=${idBranch}`);
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

      if (req.io && idBranch) {
        req.io.to(`checkout_branch_${idBranch}`).emit("receive_customer_progress", {
          idBranch,
          bookingId: idBooking,
          step: 5,
          isPaid: true,
          method: "VNPAY",
          message: `Booking #${idBooking} đã thanh toán xong!`,
        });
        req.io.to(`checkout_branch_${idBranch}`).emit("PAYMENT_SUCCESS_AD", {
          idBranch,
          idBooking
        });
      }

      return res.redirect(`${FRONTEND_URL}/kiosk?vnp_ResponseCode=00&idBranch=${idBranch}`);
    } else {
      await t.rollback();
      return res.redirect(`${FRONTEND_URL}/kiosk?vnp_ResponseCode=error`);
    }
  } catch (error) {
    if (t) await t.rollback();
    console.error("[vnpayReturn] Error:", error);
    return res.redirect(`${FRONTEND_URL}/kiosk?error=system`);
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

    if (!vnp_TxnRef) {
      return res.status(200).json({ RspCode: "99", Message: "Missing TxnRef" });
    }

    // ✅ Fix: dùng "-"
    const idBooking = vnp_TxnRef.split("-")[0];

    if (vnp_ResponseCode === "00") {
      // ✅ Fix: lấy idBranch qua barber
      const booking = await Booking.findByPk(idBooking, {
        transaction: t,
        include: [
          { association: "barber", attributes: ["idBarber", "idBranch"] }
        ]
      });

      if (!booking || booking.isPaid) {
        await t.rollback();
        return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
      }

      const idBranch = booking.barber?.idBranch;
      console.log(`[vnpayIPN] idBooking: ${idBooking}, idBranch: ${idBranch}`);

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

      if (req.io && idBranch) {
        req.io.to(`checkout_branch_${idBranch}`).emit("PAYMENT_SUCCESS_AD", {
          idBranch,
          idBooking
        });
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
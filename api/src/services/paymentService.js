// services/paymentService.js
import db from "../models/index.js";
import { Op } from "sequelize";

const {
  Booking,
  BookingDetail,
  BookingTip,
  Customer,
  LoyaltyRule,
  BarberRatingSummary,
  Service,
  sequelize,
} = db;

/**
 * Hàm chốt hạ thanh toán (Dùng chung cho Cash và VNPAY IPN)
 * @param {string} idBooking - ID của lịch hẹn
 * @param {object} paymentData - { total, tip, services }
 * @param {object} transaction - Sequelize Transaction từ Controller truyền vào
 */
export const finalizePayment = async (idBooking, paymentData, transaction) => {
  const {
    services,
    tip,
    rating,
    paymentMethod,
    voucherReverted,
    customerVoucherId,
    totalServicePrice,
    total,
  } = paymentData;

  // 1. Kiểm tra sự tồn tại của Booking
  const booking = await Booking.findByPk(idBooking, { transaction });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.isPaid) throw new Error("BOOKING_ALREADY_PAID");

  let serviceTotal = 0;

  // 2. Cập nhật Dịch vụ & Tính Total (Hybrid Pricing)
  if (Array.isArray(services) && services.length > 0) {
    // A. Lấy booking_details cũ
    const oldDetails = await BookingDetail.findAll({
      where: { idBooking },
      transaction,
    });

    // Build map: { [idService]: { price, quantity } }
    const oldMap = {};
    oldDetails.forEach((d) => {
      oldMap[d.idService] = { price: parseFloat(d.price), quantity: d.quantity };
    });

    // B. Xử lý từng service từ request
    for (const input of services) {
      const idService = typeof input === "object" ? input.idService : input;
      const quantity = input?.quantity || 1;

      if (oldMap[idService]) {
        // Service cũ → giữ nguyên price gốc từ booking_details
        const oldPrice = oldMap[idService].price;
        serviceTotal += oldPrice * quantity;

        // Cập nhật quantity (có thể thay đổi)
        await BookingDetail.update(
          { quantity },
          { where: { idBooking, idService }, transaction },
        );

        // Đánh dấu đã xử lý
        delete oldMap[idService];
      } else {
        // Service mới → lấy price hiện tại từ Service.price
        const srv = await Service.findByPk(idService, { transaction });
        if (!srv) continue;
        const currentPrice = Number(srv.price);
        serviceTotal += currentPrice * quantity;

        await BookingDetail.create(
          {
            idBooking,
            idService,
            quantity,
            price: currentPrice,
          },
          { transaction },
        );
      }
    }

    // C. Xóa service cũ không còn trong danh sách mới
    const removedIds = Object.keys(oldMap);
    if (removedIds.length > 0) {
      await BookingDetail.destroy({
        where: { idBooking, idService: { [Op.in]: removedIds } },
        transaction,
      });
    }
  } else {
    // Nếu iPad không gửi services (không đổi gì), lấy total cũ trong booking
    serviceTotal = totalServicePrice;
  }

  // 3. Lưu Tiền Tip vào bảng BookingTip
  const tipAmount = tip && Number(tip) > 0 ? Number(tip) : 0;
  if (tipAmount > 0) {
    await BookingTip.create(
      {
        idBooking: idBooking,
        idBarber: booking.idBarber,
        tipAmount: tipAmount,
      },
      { transaction },
    );
  }

  // 4. Xử lý Đánh giá (Rating)
  if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
    const [summary] = await BarberRatingSummary.findOrCreate({
      where: { idBarber: booking.idBarber },
      defaults: { totalRate: 0, avgRate: 0 },
      transaction,
    });

    const newTotalRate = summary.totalRate + 1;
    const newAvgRate =
      (Number(summary.avgRate) * summary.totalRate + Number(rating)) /
      newTotalRate;

    await summary.update(
      {
        totalRate: newTotalRate,
        avgRate: parseFloat(newAvgRate.toFixed(2)),
      },
      { transaction },
    );
  }

  // 5. Cập nhật trạng thái Booking & Total mới
  await booking.update(
    {
      isPaid: true,
      status: "Completed",
      total: total ?? serviceTotal,
      paymentMethod: paymentMethod || "Cash",
    },
    { transaction },
  );

  // 6. Cộng điểm Loyalty
  await addLoyaltyPoints(booking.idCustomer, serviceTotal, transaction);

  if (voucherReverted && customerVoucherId) {
    const VoucherService = (await import("./voucherService.js")).default;
    await VoucherService.revertVoucher(customerVoucherId, transaction);
    await booking.update({ idCustomerVoucher: null }, { transaction });
  }

  return {
    idBooking: booking.idBooking,
    serviceTotal,
    tipAmount,
    amountPaid: (total ?? serviceTotal) + tipAmount,
    isPaid: true,
  };
};

/**
 * Nội bộ: Xử lý cộng điểm Loyalty dựa trên Rules
 */
const addLoyaltyPoints = async (idCustomer, orderTotal, transaction) => {
  const customer = await Customer.findByPk(idCustomer, { transaction });
  if (!customer) return;

  const now = new Date();

  // Tìm rule phù hợp (ưu tiên rule có min_order_amount cao nhất)
  let rule = await LoyaltyRule.findOne({
    where: {
      is_active: true,
      [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: now } }],
      [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: now } }],
      min_order_amount: { [Op.lte]: orderTotal },
    },
    order: [["min_order_amount", "DESC"]],
    transaction,
  });

  // Fallback về rule mặc định nếu không có rule sự kiện nào thỏa mãn
  if (!rule) {
    rule = await LoyaltyRule.findOne({
      where: { is_default: true, is_active: true },
      transaction,
    });
  }

  if (rule) {
    const points = Math.floor(
      (orderTotal / rule.money_per_point) * rule.point_multiplier,
    );
    if (points > 0) {
      const newPoints = (customer.loyaltyPoint || 0) + points;
      await customer.update({ loyaltyPoint: newPoints }, { transaction });
      console.log(
        `[Loyalty] Customer #${idCustomer} +${points} pts (New Balance: ${newPoints})`,
      );
    }
  }
};
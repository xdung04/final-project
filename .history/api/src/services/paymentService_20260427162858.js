// services/paymentService.js
import db from "../models/index.js";
import { Op } from "sequelize";

const { Booking, BookingDetail, BookingTip, Customer, LoyaltyRule, sequelize } = db;

/**
 * Hàm chốt hạ thanh toán (Dùng chung cho Cash và VNPAY IPN)
 * @param {string} idBooking - ID của lịch hẹn
 * @param {object} paymentData - { total, tip, services }
 * @param {object} transaction - Sequelize Transaction từ Controller truyền vào
 */
export const finalizePayment = async (idBooking, paymentData, transaction) => {
  const { services, tip, rating, paymentMethod } = paymentData;

  // 1. Kiểm tra trạng thái Booking
  const booking = await Booking.findByPk(idBooking, { transaction });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.isPaid) throw new Error("BOOKING_ALREADY_PAID");

  let serviceTotal = 0;

  // 2. Tính lại tiền dịch vụ trực tiếp từ DB
  if (Array.isArray(services) && services.length > 0) {
    // Xóa chi tiết cũ
    await BookingDetail.destroy({ where: { idBooking }, transaction });

    // Lấy giá trị thực tế của các dịch vụ từ bảng Service
    const serviceIds = services.map(s => typeof s === 'object' ? s.idService : s);
    const validServices = await Service.findAll({
      where: { idService: serviceIds },
      attributes: ["idService", "price"],
      transaction
    });

    if (validServices.length !== services.length) {
      throw new Error("SOME_SERVICES_NOT_FOUND_OR_INVALID");
    }

    const newDetails = [];
    for (const srv of validServices) {
      const inputService = services.find(s => (s.idService || s) === srv.idService);
      const quantity = inputService.quantity || 1;
      
      const itemPrice = Number(srv.price);
      serviceTotal += itemPrice * quantity;

      newDetails.push({
        idBooking,
        idService: srv.idService,
        quantity: quantity,
        price: itemPrice, // Lưu đúng giá tại thời điểm cắt
      });
    }

    await BookingDetail.bulkCreate(newDetails, { transaction });
  } else {
    // Nếu không có mảng services truyền lên (khách không đổi dịch vụ), 
    // lấy lại tổng tiền cũ từ detail (hoặc từ chính booking.total nếu ông tin tưởng data cũ)
    serviceTotal = Number(booking.total); 
  }

  // 3. Xử lý Tip (nếu có)
  const tipAmount = tip && Number(tip) > 0 ? Number(tip) : 0;
  if (tipAmount > 0) {
    await BookingTip.create(
      {
        idBooking,
        idBarber: booking.idBarber,
        tipAmount: tipAmount,
      },
      { transaction }
    );
  }

  // 4. Xử lý Đánh giá (Rating) vào bảng Summary
  if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
    const rateValue = Number(rating);
    
    const [summary, created] = await BarberRatingSummary.findOrCreate({
      where: { idBarber: booking.idBarber },
      defaults: { totalRate: 0, avgRate: 0 },
      transaction
    });

    const oldTotal = summary.totalRate;
    const oldAvg = Number(summary.avgRate);
    
    const newTotal = oldTotal + 1;
    const newAvg = ((oldAvg * oldTotal) + rateValue) / newTotal;

    await summary.update(
      {
        totalRate: newTotal,
        avgRate: parseFloat(newAvg.toFixed(2)) 
      },
      { transaction }
    );
  }

  // 5. Cập nhật Booking (CHỈ LƯU TIỀN DỊCH VỤ VÀO TOTAL)
  await booking.update(
    {
      isPaid: true,
      status: "Completed", 
      total: serviceTotal, // <-- Sửa lại chỉ lưu serviceTotal để chuẩn luồng tính lương
      paymentMethod: paymentMethod || "Cash", 
    },
    { transaction }
  );

  // 6. Tính điểm Loyalty (Chỉ tính trên tiền dịch vụ)
  // if (typeof addLoyaltyPoints === "function") {
  //   await addLoyaltyPoints(booking.idCustomer, serviceTotal, transaction);
  // }

  return {
    idBooking: booking.idBooking,
    total: serviceTotal,          // Doanh thu dịch vụ (khớp với DB Booking)
    tip: tipAmount,               // Tiền tip (nằm ở DB BookingTip)
    customerMustPay: serviceTotal + tipAmount, // TỔNG CỘNG KHÁCH PHẢI TRẢ (Show lên iPad)
    isPaid: true,
    paymentMethod,
    status: "Completed"
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
    const points = Math.floor((orderTotal / rule.money_per_point) * rule.point_multiplier);
    if (points > 0) {
      const newPoints = (customer.loyaltyPoint || 0) + points;
      await customer.update({ loyaltyPoint: newPoints }, { transaction });
      console.log(`[Loyalty] Customer #${idCustomer} +${points} pts (New Balance: ${newPoints})`);
    }
  }
};
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
  const { total, tip, services } = paymentData;

  // 1. Kiểm tra sự tồn tại và trạng thái của Booking
  const booking = await Booking.findByPk(idBooking, { transaction });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.isPaid) throw new Error("BOOKING_ALREADY_PAID");

  // 2. Cập nhật chi tiết dịch vụ thực tế đã thực hiện
  if (Array.isArray(services) && services.length > 0) {
    // Xóa dịch vụ cũ của booking đó
    await BookingDetail.destroy({ where: { idBooking }, transaction });
    
    // Tạo lại danh sách dịch vụ mới
    const newDetails = services.map((idService) => ({
      idBooking,
      idService,
      price: 0, // Giá có thể map từ bảng Service nếu cần lưu log giá tại thời điểm đó
    }));
    await BookingDetail.bulkCreate(newDetails, { transaction });
  }

  // 3. Xử lý tiền Tip cho Barber
  if (tip && Number(tip) > 0) {
    await BookingTip.create(
      { 
        idBooking, 
        idBarber: booking.idBarber, 
        tipAmount: tip 
      }, 
      { transaction }
    );
  }

  // 4. Cập nhật trạng thái Booking sang Đã thanh toán
  const finalTotal = total || booking.total;
  await booking.update(
    {
      isPaid: true,
      total: finalTotal,
    },
    { transaction }
  );

  // 5. Tính toán và cộng điểm thưởng Loyalty cho khách hàng
  await addLoyaltyPoints(booking.idCustomer, finalTotal, transaction);

  return {
    idBooking: booking.idBooking,
    total: finalTotal,
    isPaid: true
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
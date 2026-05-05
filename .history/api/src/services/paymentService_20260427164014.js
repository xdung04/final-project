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

  // 1. Kiểm tra sự tồn tại của Booking
  const booking = await Booking.findByPk(idBooking, { transaction });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.isPaid) throw new Error("BOOKING_ALREADY_PAID");

  let serviceTotal = 0;

  // 2. Cập nhật Dịch vụ & Tính Total (Cực kỳ quan trọng)
  // Nếu iPad gửi về danh sách dịch vụ (có thể đã thêm mới/thay đổi)
  if (Array.isArray(services) && services.length > 0) {
    // A. Xóa sạch detail cũ của booking này
    await BookingDetail.destroy({ where: { idBooking }, transaction });

    // B. Lấy thông tin giá mới nhất từ bảng Service để tính tiền
    const serviceIds = services.map(s => (typeof s === 'object' ? s.idService : s));
    const dbServices = await Service.findAll({
      where: { idService: serviceIds },
      transaction
    });

    const newDetails = [];
    for (const srv of dbServices) {
      // Tìm lại quantity từ data iPad gửi lên (nếu có), không thì mặc định 1
      const input = services.find(s => (s.idService || s) === srv.idService);
      const quantity = input?.quantity || 1;
      const priceAtTime = Number(srv.price);

      serviceTotal += priceAtTime * quantity;

      newDetails.push({
        idBooking: idBooking,
        idService: srv.idService,
        quantity: quantity,
        price: priceAtTime // Lưu giá lúc thanh toán
      });
    }

    // C. Lưu lại danh sách dịch vụ mới vào DB
    await BookingDetail.bulkCreate(newDetails, { transaction });
  } else {
    // Nếu iPad không gửi services (không đổi gì), lấy total cũ trong booking
    serviceTotal = Number(booking.total);
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
      { transaction }
    );
  }

  // 4. Xử lý Đánh giá (Rating)
  if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
    const [summary] = await BarberRatingSummary.findOrCreate({
      where: { idBarber: booking.idBarber },
      defaults: { totalRate: 0, avgRate: 0 },
      transaction
    });

    const newTotalRate = summary.totalRate + 1;
    const newAvgRate = ((Number(summary.avgRate) * summary.totalRate) + Number(rating)) / newTotalRate;

    await summary.update({
      totalRate: newTotalRate,
      avgRate: parseFloat(newAvgRate.toFixed(2))
    }, { transaction });
  }

  // 5. Cập nhật trạng thái Booking & Total mới
  // Ở đây Total CHỈ lưu tiền dịch vụ như ông yêu cầu
  await booking.update(
    {
      isPaid: true,
      status: "Completed",
      total: serviceTotal, 
      paymentMethod: paymentMethod || "Cash",
    },
    { transaction }
  );

  // 6. Cộng điểm Loyalty (Sử dụng hàm của ông)
  // Lưu ý: serviceTotal là số tiền thực tế khách trả cho các dịch vụ

    await addLoyaltyPoints(booking.idCustomer, serviceTotal, transaction);


  return {
    idBooking: booking.idBooking,
    serviceTotal,
    tipAmount,
    amountPaid: serviceTotal + tipAmount, // Tổng tiền khách đã thanh toán
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
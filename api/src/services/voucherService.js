import db from "../models/index.js";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
class VoucherService {
  // --- Các hàm hiện có ---
  async createVoucher(data) {
    try {
      const voucher = await db.Voucher.create({
        title: data.title,
        discountPercent: data.discountPercent,
        pointCost: data.pointCost,
        totalQuantity: data.totalQuantity,
        expiryDate: data.expiryDate,
        description: data.description,
        status: true,
      });
      return voucher;
    } catch (error) {
      throw new Error("Error creating voucher: " + error.message);
    }
  }

  async getAllVouchers() {
    return await db.Voucher.findAll({ where: { status: true } });
  }

  async getVoucherById(idVoucher) {
    return await db.Voucher.findOne({ where: { idVoucher, status: true } });
  }

  async updateVoucher(idVoucher, data) {
    const voucher = await db.Voucher.findByPk(idVoucher);
    if (!voucher) throw new Error("Voucher not found");
    return await voucher.update({
      title: data.title ?? voucher.title,
      discountPercent: data.discountPercent ?? voucher.discountPercent,
      pointCost: data.pointCost ?? voucher.pointCost,
      totalQuantity: data.totalQuantity ?? voucher.totalQuantity,
      expiryDate: data.expiryDate ?? voucher.expiryDate,
      description: data.description ?? voucher.description,
      status: data.status ?? voucher.status,
    });
  }

  async deleteVoucher(idVoucher) {
    const voucher = await db.Voucher.findByPk(idVoucher);
    if (!voucher) throw new Error("Voucher not found");
    return await voucher.update({ status: false });
  }

  // --- Các hàm thèm thêm ---
  
  // Lấy voucher đã đổi nhưng chưa áp dụng
  async getCustomerVouchers(idCustomer) {
    return await db.CustomerVoucher.findAll({
      where: { 
        idCustomer,
        status: 'unused',
      },
      include: [{
        model: db.Voucher,
        as: 'voucher',
        where: { 
          status: true,
          expiryDate: { [Op.or]: [{ [Op.gte]: new Date() }, null] },
        },
      }],
    });
  }

  // Lấy voucher khách có thể đổi bằng point (chưa từng đổi)
async getAvailableVouchersByPoint(idCustomer, customerPoint) {
  // Lấy tất cả idVoucher mà khách đã đổi
  const exchangedVouchers = await db.CustomerVoucher.findAll({
    where: { idCustomer },
    attributes: ["idVoucher"],
  });
  const exchangedIds = exchangedVouchers.map(v => v.idVoucher);

  // Lấy voucher còn hạn, đủ điểm, và chưa từng đổi
  return await db.Voucher.findAll({
    where: {
      status: true,
      expiryDate: { [Op.or]: [{ [Op.gte]: new Date() }, null] },
      pointCost: { [Op.lte]: customerPoint },
      idVoucher: exchangedIds.length
        ? { [Op.notIn]: exchangedIds }
        : { [Op.ne]: null }, // nếu khách chưa đổi gì thì lấy tất cả
    },
  });
}

 async exchangeVoucherForCustomer(idCustomer, idVoucher, t) { // nhận transaction t
  // 1. Lấy voucher
  const voucher = await db.Voucher.findOne({
    where: {
      idVoucher,
      status: true,
      [Op.or]: [{ expiryDate: { [Op.gte]: new Date() } }, { expiryDate: null }],
    },
    transaction: t,
    lock: t.LOCK.UPDATE, // khóa row để tránh race condition
  });
  if (!voucher) throw new Error("Voucher không tồn tại hoặc đã hết hạn");

  // 2. Lấy khách hàng
  const customer = await db.Customer.findByPk(idCustomer, { transaction: t, lock: t.LOCK.UPDATE });
  if (!customer) throw new Error("Khách hàng không tồn tại");

  // 3. Kiểm tra điểm khách
  if (customer.loyaltyPoint < voucher.pointCost) throw new Error("Điểm khách hàng không đủ để đổi voucher");

  // 4. Kiểm tra khách đã đổi voucher này chưa
  const existing = await db.CustomerVoucher.findOne({
    where: { idCustomer, idVoucher },
    transaction: t,
  });
  if (existing) throw new Error("Khách đã đổi voucher này rồi");

  // 5. Tạo voucherCode duy nhất
  const voucherCode = uuidv4();

  // 6. Trừ điểm khách
  await customer.update({ loyaltyPoint: customer.loyaltyPoint - voucher.pointCost }, { transaction: t });

  // 7. Giảm số lượng voucher nếu có giới hạn
  if (voucher.totalQuantity !== null && voucher.totalQuantity > 0) {
    await voucher.update({ totalQuantity: voucher.totalQuantity - 1 }, { transaction: t });
  }

  // 8. Tạo CustomerVoucher
  const customerVoucher = await db.CustomerVoucher.create({
    idCustomer,
    idVoucher,
    voucherCode,
    status: "unused",
    obtainedAt: new Date(),
    expiredAt: voucher.expiryDate,
  }, { transaction: t });

  return { customerVoucher, idCustomerVoucher: customerVoucher.id };
}
   /**
   * Lấy điểm của khách hàng theo idCustomer
   * @param {number} idCustomer
   * @returns {Promise<number|null>} Trả về điểm khách hoặc null nếu không tồn tại
   */
  async getCustomerPoints(idCustomer) {
    const customer = await db.Customer.findByPk(idCustomer, {
      attributes: ["loyaltyPoint"], // chỉ lấy trường điểm
    });
    return customer ? customer.loyaltyPoint : null;
  }

}
  



export default new VoucherService();

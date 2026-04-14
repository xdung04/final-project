import voucherService from "../services/voucherService.js";
import db from "../models/index.js";
class VoucherController {
  // --- CRUD cơ bản ---
  async create(req, res) {
    try {
      const voucher = await voucherService.createVoucher(req.body);
      res.status(201).json({ success: true, data: voucher });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const vouchers = await voucherService.getAllVouchers();
      res.status(200).json({ success: true, data: vouchers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const voucher = await voucherService.getVoucherById(id);
      if (!voucher) {
        return res.status(404).json({ success: false, message: "Voucher not found" });
      }
      res.status(200).json({ success: true, data: voucher });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updatedVoucher = await voucherService.updateVoucher(id, req.body);
      res.status(200).json({ success: true, data: updatedVoucher });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedVoucher = await voucherService.deleteVoucher(id);
      res.status(200).json({ success: true, data: deletedVoucher });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- Voucher khách đã đổi nhưng chưa áp dụng ---
  async getCustomerVouchers(req, res) {
    try {
      const idCustomer = req.user.idUser; // lấy từ token
      const vouchers = await voucherService.getCustomerVouchers(idCustomer);
      res.status(200).json({ success: true, data: vouchers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- Voucher khách có thể đổi bằng point ---
async getAvailableVouchersByPoint(req, res) {
  try {
    const idCustomer = req.user.idUser; // lấy từ token

    // Lấy điểm khách hàng từ database
    const customerPoint = await voucherService.getCustomerPoints(idCustomer);
    if (customerPoint === null) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Lấy voucher có thể đổi dựa trên điểm khách
    const vouchers = await voucherService.getAvailableVouchersByPoint(idCustomer, customerPoint);

    res.status(200).json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


  // --- Đổi voucher ---
  async exchangeVoucher(req, res) {
  const t = await db.sequelize.transaction(); // bắt đầu transaction
  try {
    const idCustomer = req.user.idUser; // lấy từ token
    const { idVoucher } = req.body;

    // 1. Lấy voucher trước để kiểm tra tồn tại và điểm
    const voucher = await voucherService.getVoucherById(idVoucher);
    if (!voucher) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    // 2. Lấy điểm khách
    const points = await voucherService.getCustomerPoints(idCustomer);
    if (points === null) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (points < voucher.pointCost) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Not enough points" });
    }

    // 3. Gọi service để đổi voucher và trừ điểm (trong transaction)
    const { customerVoucher } = await voucherService.exchangeVoucherForCustomer(idCustomer, idVoucher, t);

    // 4. Commit transaction
    await t.commit();

    res.status(200).json({ success: true, data: customerVoucher });
  } catch (error) {
    await t.rollback(); // rollback nếu lỗi
    console.error('ExchangeVoucher error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
}

export default new VoucherController();

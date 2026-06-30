import voucherService from "../services/voucherService.js";
import db from "../models/index.js";

class VoucherController {
  // ======================== ADMIN: CRUD ========================

  async create(req, res) {
    try {
      const voucher = await voucherService.createVoucher(req.body);
      res.status(201).json({ success: true, data: voucher });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
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
      if (!voucher)
        return res.status(404).json({ success: false, message: "Voucher không tồn tại" });
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
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedVoucher = await voucherService.deleteVoucher(id);
      res.status(200).json({ success: true, data: deletedVoucher });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================== ADMIN: RETENTION ========================

  async issueRetentionVouchers(req, res) {
    const transaction = await db.sequelize.transaction();
    try {
      const { customerIds, voucherId } = req.body;
      if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0)
        return res.status(400).json({ success: false, message: "Danh sách khách không hợp lệ" });
      if (!voucherId)
        return res.status(400).json({ success: false, message: "Thiếu voucherId" });

      const result = await voucherService.issueRetentionVouchers(
        customerIds,
        voucherId,
        transaction
      );
      await transaction.commit();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================== ADMIN: THỐNG KÊ ========================

  // [ĐÃ SỬA] Đổi voucherId → id cho đồng nhất với các route khác (/:id/stats)
  async getVoucherStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await voucherService.getVoucherStats(id);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ======================== CUSTOMER: KHO VOUCHER ========================

  async getCustomerAvailableVouchers(req, res) {
    try {
      const customerId = req.user.idUser;
      const vouchers = await voucherService.getCustomerAvailableVouchers(customerId);
      res.status(200).json({ success: true, data: vouchers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCustomerVoucherHistory(req, res) {
    try {
      const customerId = req.user.idUser;
      const history = await voucherService.getCustomerVoucherHistory(customerId);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ======================== CUSTOMER: CAMPAIGN ========================

  async getActiveCampaigns(req, res) {
    try {
      const customerId = req.user.idUser;
      const campaigns = await voucherService.getActiveCampaigns(customerId);
      res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async collectCampaignVoucher(req, res) {
    try {
      const customerId = req.user.idUser;
      const { voucherId } = req.body;
      if (!voucherId)
        return res.status(400).json({ success: false, message: "Thiếu voucherId" });

      const result = await voucherService.collectCampaignVoucher(customerId, voucherId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================== CUSTOMER: POINTS_EXCHANGE ========================

  async getExchangeableVouchers(req, res) {
    try {
      const customerId = req.user.idUser;
      const customer = await db.Customer.findByPk(customerId);
      if (!customer)
        return res.status(404).json({ success: false, message: "Khách hàng không tồn tại" });

      const vouchers = await voucherService.getExchangeableVouchers(
        customerId,
        customer.loyaltyPoint
      );
      res.status(200).json({ success: true, data: vouchers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async exchangeVoucher(req, res) {
    const transaction = await db.sequelize.transaction();
    try {
      const customerId = req.user.idUser;
      const { voucherId } = req.body;
      if (!voucherId)
        return res.status(400).json({ success: false, message: "Thiếu voucherId" });

      const result = await voucherService.exchangeVoucher(customerId, voucherId, transaction);
      await transaction.commit();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ======================== APPLY VOUCHER (gọi từ bookingService) ========================

  /**
   * Endpoint này chỉ dùng để validate + tính discount
   * bookingService sẽ gọi voucherService.applyVoucher trực tiếp
   * và tự update bookings.idCustomerVoucher
   * Endpoint này có thể dùng để preview discount trước khi confirm booking
   */
  async applyVoucher(req, res) {
    try {
      const customerId = req.user.idUser;
      const { customerVoucherId, invoiceAmount } = req.body;
      if (!customerVoucherId || !invoiceAmount)
        return res.status(400).json({ success: false, message: "Thiếu thông tin áp dụng voucher" });

      // [ĐÃ SỬA] Bỏ bookingId khỏi params vì không cần ở bước preview
      const result = await voucherService.applyVoucher(
        customerVoucherId,
        customerId,
        invoiceAmount
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCustomerPoints(req, res) {
  try {
    const customerId = req.user.idUser;
    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
    }
    res.json({ success: true, points: customer.loyaltyPoint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
}

export default new VoucherController();
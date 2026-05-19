import db from "../models/index.js";
import { Op } from "sequelize";

class VoucherService {
  // ======================== ADMIN: CRUD VOUCHER ========================

  async createVoucher(data) {
    try {
      if (data.type === "POINTS_EXCHANGE") {
        if (!data.points_required || data.points_required <= 0)
          throw new Error("points_required phải lớn hơn 0");
        if (!data.discount_amount || data.discount_amount <= 0)
          throw new Error(
            "discount_amount phải lớn hơn 0 với loại POINTS_EXCHANGE",
          );
      }
      if (data.type === "CAMPAIGN") {
        if (!data.start_date || !data.end_date)
          throw new Error(
            "start_date và end_date là bắt buộc với loại CAMPAIGN",
          );
        if (new Date(data.start_date) > new Date(data.end_date))
          throw new Error("start_date phải trước end_date");
      }
      const voucher = await db.Voucher.create(data);
      return voucher;
    } catch (error) {
      throw new Error("Lỗi khi tạo voucher: " + error.message);
    }
  }

  async getAllVouchers() {
    return await db.Voucher.findAll({ where: { is_active: true } });
  }

  async getVoucherById(id) {
    return await db.Voucher.findByPk(id);
  }

  async updateVoucher(id, data) {
    const voucher = await db.Voucher.findByPk(id);
    if (!voucher) throw new Error("Voucher không tồn tại");
    await voucher.update(data);
    return voucher;
  }

  async deleteVoucher(id) {
    const voucher = await db.Voucher.findByPk(id);
    if (!voucher) throw new Error("Voucher không tồn tại");
    await voucher.update({ is_active: false });
    return voucher;
  }

  // ======================== CUSTOMER: KHO VOUCHER ========================

  /**
   * Lấy danh sách voucher AVAILABLE của khách (chưa hết hạn)
   * Không cần cron job — check expires_at real-time khi query
   */
  async getCustomerAvailableVouchers(customerId) {
    const now = new Date();
    return await db.CustomerVoucher.findAll({
      where: {
        customer_id: customerId,
        status: "AVAILABLE",
        [Op.or]: [
          { expires_at: { [Op.gte]: now } },
          { expires_at: null }, // null = không hết hạn
        ],
      },
      include: [{ model: db.Voucher, as: "voucher" }],
      order: [["expires_at", "ASC"]], // sắp xếp sắp hết hạn lên trước
    });
  }

  /**
   * Lấy danh sách voucher khách đã dùng hoặc hết hạn (lịch sử)
   */
  async getCustomerVoucherHistory(customerId) {
    return await db.CustomerVoucher.findAll({
      where: {
        customer_id: customerId,
        status: { [Op.in]: ["USED", "EXPIRED"] },
      },
      include: [{ model: db.Voucher, as: "voucher" }],
      order: [["updated_at", "DESC"]],
    });
  }

  // ======================== NEW_CUSTOMER ========================

  /**
   * Tự động phát voucher NEW_CUSTOMER khi khách đăng ký
   * - Tìm tất cả template NEW_CUSTOMER đang active
   * - Mỗi khách chỉ nhận 1 lần mỗi template (hardcode max = 1)
   * - expires_at = issued_at + valid_days (null nếu valid_days = null)
   */
  async issueNewCustomerVoucher(customerId) {
    const vouchers = await db.Voucher.findAll({
      where: { type: "NEW_CUSTOMER", is_active: true },
    });

    for (const voucher of vouchers) {
      const existing = await db.CustomerVoucher.findOne({
        where: { customer_id: customerId, voucher_id: voucher.id },
      });
      if (existing) continue;

      const issuedAt = new Date();
      const expiresAt = voucher.valid_days
        ? new Date(
            issuedAt.getTime() + voucher.valid_days * 24 * 60 * 60 * 1000,
          )
        : null;

      await db.CustomerVoucher.create({
        voucher_id: voucher.id,
        customer_id: customerId,
        status: "AVAILABLE",
        issued_at: issuedAt,
        expires_at: expiresAt,
        source_note: "new_customer_welcome",
      });
    }
  }

  // ======================== POINTS_EXCHANGE ========================

  /**
   * Lấy danh sách voucher khách có thể đổi điểm
   * Đếm tổng lần đã đổi (AVAILABLE + USED + EXPIRED) so với max_usage_per_customer
   * Lý do: khách đổi 1 lần dùng xong, nếu max = 3 vẫn cần thấy voucher để đổi tiếp
   */
  async getExchangeableVouchers(customerId, customerPoints) {
    const allVouchers = await db.Voucher.findAll({
      where: {
        type: "POINTS_EXCHANGE",
        is_active: true,
      },
    });

    const result = [];
    for (const voucher of allVouchers) {
      // Đếm tổng số lần khách đã đổi voucher này (bất kể trạng thái)
      const totalExchanged = await db.CustomerVoucher.count({
        where: {
          customer_id: customerId,
          voucher_id: voucher.id,
          status: { [Op.in]: ["AVAILABLE", "USED", "EXPIRED"] },
        },
      });

      const max = voucher.max_usage_per_customer ?? 1;
      const isPointEnough = customerPoints >= voucher.points_required;
      const isUnderLimit = totalExchanged < max;
      const canExchange = isPointEnough && isUnderLimit;

      let reason = null;
      if (!isPointEnough) reason = "not_enough_points";
      else if (!isUnderLimit) reason = "max_exchanged";

      result.push({
        ...voucher.toJSON(),
        can_exchange: canExchange,
        reason: reason,
        exchanged_count: totalExchanged,
        max_exchange: max,
      });
    }
    return result;
  }

  /**
   * Khách đổi điểm lấy voucher
   * Đếm tất cả lần đã đổi (AVAILABLE + USED + EXPIRED) khi check max_usage
   * Lý do: 1 lần đổi = 1 lần dù chưa dùng, dùng rồi hay hết hạn đều tính
   */
  async exchangeVoucher(customerId, voucherId, transaction) {
    const voucher = await db.Voucher.findOne({
      where: { id: voucherId, type: "POINTS_EXCHANGE", is_active: true },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!voucher) throw new Error("Voucher không tồn tại hoặc không hoạt động");

    const customer = await db.Customer.findByPk(customerId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!customer) throw new Error("Khách hàng không tồn tại");
    if (customer.loyaltyPoint < voucher.points_required)
      throw new Error("Không đủ điểm để đổi voucher này");

    const totalExchanged = await db.CustomerVoucher.count({
      where: {
        customer_id: customerId,
        voucher_id: voucherId,
        status: { [Op.in]: ["AVAILABLE", "USED", "EXPIRED"] },
      },
      transaction,
    });
    if (
      voucher.max_usage_per_customer !== null &&
      totalExchanged >= voucher.max_usage_per_customer
    ) {
      throw new Error("Bạn đã đổi voucher này đủ số lần tối đa");
    }

    const issuedAt = new Date();
    const expiresAt = voucher.valid_days
      ? new Date(issuedAt.getTime() + voucher.valid_days * 24 * 60 * 60 * 1000)
      : null;

    const customerVoucher = await db.CustomerVoucher.create(
      {
        voucher_id: voucherId,
        customer_id: customerId,
        status: "AVAILABLE",
        issued_at: issuedAt,
        expires_at: expiresAt,
        source_note: `exchanged_${voucher.points_required}_points`,
      },
      { transaction },
    );

    await customer.update(
      { loyaltyPoint: customer.loyaltyPoint - voucher.points_required },
      { transaction },
    );

    return customerVoucher;
  }

  // ======================== RETENTION ========================

  /**
   * Admin gửi voucher RETENTION cho danh sách khách rủi ro
   * Điều kiện lọc:
   *   1. Khách không có voucher AVAILABLE cùng template (tránh gửi khi chưa dùng)
   *   2. Số lần USED < max_usage_per_customer
   *      → Chỉ đếm USED, không đếm EXPIRED (khách nhận mà không dùng không bị thiệt)
   * expires_at = issued_at(ngày admin gửi) + valid_days
   */
  async issueRetentionVouchers(customerIds, voucherId, transaction) {
    const voucher = await db.Voucher.findByPk(voucherId, { transaction });
    if (!voucher || voucher.type !== "RETENTION")
      throw new Error("Voucher RETENTION không hợp lệ");
    if (!voucher.valid_days)
      throw new Error("Voucher RETENTION phải có valid_days");

    const results = [];
    const skipped = [];

    for (const customerId of customerIds) {
      // Điều kiện 1: không có voucher AVAILABLE cùng template
      const existing = await db.CustomerVoucher.findOne({
        where: {
          customer_id: customerId,
          voucher_id: voucherId,
          status: "AVAILABLE",
        },
        transaction,
      });
      if (existing) {
        skipped.push({ customerId, reason: "already_has_available" });
        continue;
      }

      // Điều kiện 2: chưa vượt max số lần DÙNG (chỉ đếm USED)
      if (voucher.max_usage_per_customer !== null) {
        const usedCount = await db.CustomerVoucher.count({
          where: {
            customer_id: customerId,
            voucher_id: voucherId,
            status: "USED",
          },
          transaction,
        });
        if (usedCount >= voucher.max_usage_per_customer) {
          skipped.push({ customerId, reason: "max_usage_reached" });
          continue;
        }
      }

      const issuedAt = new Date();
      const expiresAt = new Date(
        issuedAt.getTime() + voucher.valid_days * 24 * 60 * 60 * 1000,
      );

      const cv = await db.CustomerVoucher.create(
        {
          voucher_id: voucherId,
          customer_id: customerId,
          status: "AVAILABLE",
          issued_at: issuedAt,
          expires_at: expiresAt,
          source_note: "retention_gift",
        },
        { transaction },
      );

      results.push(cv);
    }

    return { issued: results, skipped };
  }

  // ======================== CAMPAIGN ========================

  /**
   * Lấy danh sách campaign đang diễn ra để khách thu thập
   * Chỉ hiện: còn hạn + còn slot + khách chưa thu thập đủ max lần
   */
  async getActiveCampaigns(customerId) {
    const now = new Date();
    const campaigns = await db.Voucher.findAll({
      where: {
        type: "CAMPAIGN",
        is_active: true,
        start_date: { [Op.lte]: now },
        end_date: { [Op.gte]: now },
        [Op.or]: [
          { total_quantity: null },
          { total_quantity: { [Op.gt]: db.sequelize.col("issued_count") } },
        ],
      },
    });

    const result = [];
    for (const campaign of campaigns) {
      const collected = await db.CustomerVoucher.count({
        where: { customer_id: customerId, voucher_id: campaign.id },
      });
      const max = campaign.max_usage_per_customer ?? 1;
      if (collected < max) {
        result.push({ ...campaign.toJSON(), collected });
      }
    }
    return result;
  }

  /**
   * Khách thu thập voucher CAMPAIGN
   * Dùng transaction + lock để tránh race condition
   * Chỉ dùng 1 lần count để check max_usage (bỏ check existing riêng)
   */
  async collectCampaignVoucher(customerId, voucherId) {
    const transaction = await db.sequelize.transaction();
    try {
      const voucher = await db.Voucher.findByPk(voucherId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!voucher || voucher.type !== "CAMPAIGN")
        throw new Error("Campaign không hợp lệ");
      if (!voucher.is_active) throw new Error("Campaign không còn hoạt động");

      const now = new Date();
      if (voucher.start_date && new Date(voucher.start_date) > now)
        throw new Error("Campaign chưa bắt đầu");
      if (voucher.end_date && new Date(voucher.end_date) < now)
        throw new Error("Campaign đã kết thúc");
      if (
        voucher.total_quantity !== null &&
        voucher.issued_count >= voucher.total_quantity
      ) {
        throw new Error("Voucher campaign đã hết");
      }

      const totalCollected = await db.CustomerVoucher.count({
        where: { customer_id: customerId, voucher_id: voucherId },
        transaction,
      });
      const max = voucher.max_usage_per_customer ?? 1;
      if (totalCollected >= max)
        throw new Error("Bạn đã thu thập voucher này rồi");

      const expiresAt = voucher.end_date ? new Date(voucher.end_date) : null;

      const customerVoucher = await db.CustomerVoucher.create(
        {
          voucher_id: voucherId,
          customer_id: customerId,
          status: "AVAILABLE",
          issued_at: now,
          expires_at: expiresAt,
          source_note: "campaign_collect",
        },
        { transaction },
      );

      await voucher.increment("issued_count", { transaction });
      await transaction.commit();
      return customerVoucher;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ======================== ÁP DỤNG VOUCHER KHI BOOKING ========================

  /**
   * Áp dụng voucher khi đặt lịch
   * Chỉ check: AVAILABLE + chưa hết hạn + đủ min_invoice_amount
   * Không check max_usage vì đã kiểm soát từ bước đổi/thu thập
   * Không update booking_id vì FK nằm ở bookings.idCustomerVoucher
   * → bookingService tự cập nhật idCustomerVoucher sau khi gọi hàm này
   */
  async applyVoucher(customerVoucherId, customerId, invoiceAmount) {
    const now = new Date();

    const customerVoucher = await db.CustomerVoucher.findOne({
      where: {
        id: customerVoucherId,
        customer_id: customerId,
        status: "AVAILABLE",
      },
      include: [{ model: db.Voucher, as: "voucher" }],
    });
    if (!customerVoucher)
      throw new Error("Voucher không tồn tại hoặc không khả dụng");

    const voucher = customerVoucher.voucher;

    // Check hết hạn real-time (không cần cron job)
    if (customerVoucher.expires_at && customerVoucher.expires_at < now)
      throw new Error("Voucher đã hết hạn");

    // Check hóa đơn tối thiểu
    if (
      voucher.min_invoice_amount &&
      invoiceAmount < voucher.min_invoice_amount
    )
      throw new Error(
        `Hóa đơn tối thiểu để dùng voucher này là ${Number(voucher.min_invoice_amount).toLocaleString()}đ`,
      );

    // Tính tiền giảm
    let discountAmount = 0;
    if (voucher.discount_amount && voucher.discount_amount > 0) {
      discountAmount = Math.min(voucher.discount_amount, invoiceAmount);
      // nếu có max_discount_amount thì áp dụng (với POINTS_EXCHANGE thường không có)
      if (
        voucher.max_discount_amount &&
        discountAmount > voucher.max_discount_amount
      ) {
        discountAmount = voucher.max_discount_amount;
      }
    } else if (voucher.discount_percent) {
      discountAmount = invoiceAmount * (voucher.discount_percent / 100);
      if (
        voucher.max_discount_amount &&
        discountAmount > voucher.max_discount_amount
      ) {
        discountAmount = voucher.max_discount_amount;
      }
    } else {
      throw new Error("Voucher không có giá trị giảm giá hợp lệ");
    }

    // [ĐÃ SỬA] Chỉ update status + used_at, bỏ booking_id
    // booking_id không còn ở customer_vouchers
    // bookingService sẽ tự update bookings.idCustomerVoucher
    await customerVoucher.update({
      status: "USED",
      used_at: now,
    });

    return {
      customerVoucherId: customerVoucher.id,
      discountAmount,
      finalAmount: invoiceAmount - discountAmount,
      voucherName: voucher.name,
      discountPercent: voucher.discount_percent,
    };
  }

  // ======================== THỐNG KÊ ADMIN ========================

  /**
   * Thống kê hiệu quả 1 template voucher
   * Query trực tiếp từ customer_vouchers, không dùng trường đếm riêng
   */
  async getVoucherStats(voucherId) {
    const voucher = await db.Voucher.findByPk(voucherId);
    if (!voucher) throw new Error("Voucher không tồn tại");

    const [totalIssued, totalUsed, totalExpired, totalAvailable] =
      await Promise.all([
        db.CustomerVoucher.count({ where: { voucher_id: voucherId } }),
        db.CustomerVoucher.count({
          where: { voucher_id: voucherId, status: "USED" },
        }),
        db.CustomerVoucher.count({
          where: { voucher_id: voucherId, status: "EXPIRED" },
        }),
        db.CustomerVoucher.count({
          where: { voucher_id: voucherId, status: "AVAILABLE" },
        }),
      ]);

    return {
      voucher,
      stats: {
        totalIssued,
        totalUsed,
        totalExpired,
        totalAvailable,
        usageRate:
          totalIssued > 0
            ? ((totalUsed / totalIssued) * 100).toFixed(1) + "%"
            : "0%",
      },
    };
  }
}

export default new VoucherService();

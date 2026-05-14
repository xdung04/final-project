import { Op, fn, col, literal } from "sequelize";
import db from "../models/index.js";

class TransactionService {
  /**
   * Lấy danh sách giao dịch cho Lễ tân theo Chi nhánh (Mặc định là ngày hôm nay)
   */
  async getTransactionsForReceptionist({ idBranch, search, dateFrom, dateTo, statusFilter, methodFilter, page, limit }) {
    const offset = (page - 1) * limit;
    const bookingWhere = {};

    // 🌟 ĐỒNG BỘ MÚI GIỜ: Nếu không chọn bộ lọc, ép về ngày hôm nay bằng DATE_FORMAT của MySQL
    if (!dateFrom && !dateTo && !search) { 
      const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }); // "2026-05-13"
      
      // Tạo điều kiện: WHERE DATE_FORMAT(bookingDate, '%Y-%m-%d') = '2026-05-13'
      bookingWhere[Op.and] = [
        db.sequelize.where(
          fn("DATE_FORMAT", col("bookingDate"), "%Y-%m-%d"),
          today
        )
      ];
    } else {
      // Nếu có chọn bộ lọc ngày cụ thể từ giao diện
      if (dateFrom || dateTo) {
        if (dateFrom && dateTo) {
          bookingWhere.bookingDate = { [Op.between]: [`${dateFrom} 00:00:00`, `${dateTo} 23:59:59`] };
        } else if (dateFrom) {
          bookingWhere.bookingDate = { [Op.gte]: `${dateFrom} 00:00:00` };
        } else if (dateTo) {
          bookingWhere.bookingDate = { [Op.lte]: `${dateTo} 23:59:59` };
        }
      }
    }

    // Lọc theo trạng thái
    if (statusFilter && statusFilter !== "all") {
      const statusMap = { completed: "Completed", cancelled: "Cancelled", pending: "Pending" };
      bookingWhere.status = statusMap[statusFilter] || statusFilter;
    }

    // Lọc theo phương thức thanh toán
    if (methodFilter && methodFilter !== "all") {
      const methodMap = { cash: "Cash", transfer: "Transfer" };
      bookingWhere.paymentMethod = methodMap[methodFilter];
    }

    // Xử lý tìm kiếm Text
    let userCustomerWhere = {};
    if (search) {
      if (!isNaN(search)) {
        bookingWhere.idBooking = Number(search);
      } else {
        userCustomerWhere.fullName = { [Op.like]: `%${search}%` };
      }
    }

    // Tách riêng đếm để tăng tốc độ
    const count = await db.Booking.count({
      where: bookingWhere,
      include: [
        {
          model: db.Customer,
          required: search && isNaN(search) ? true : false,
          include: [{ model: db.User, as: "user", where: userCustomerWhere }]
        },
        {
          model: db.Barber,
          as: "barber",
          required: true,
          where: { idBranch: idBranch }
        }
      ]
    });

    const rows = await db.Booking.findAll({
      where: bookingWhere,
      limit: Number(limit),
      offset: Number(offset),
      order: [["bookingDate", "DESC"], ["bookingTime", "DESC"]],
      include: [
        {
          model: db.Customer,
          include: [{
            model: db.User,
            as: "user",
            attributes: ["fullName", "image"]
          }]
        },
        {
          model: db.Barber,
          as: "barber",
          required: true,
          where: { idBranch: idBranch },
          include: [{
            model: db.User,
            as: "user",
            attributes: ["fullName"]
          }]
        }
      ]
    });

    // Mapping dữ liệu cho Frontend
    const transactions = rows.map((b) => ({
      id: b.idBooking,
      customer: b.Customer?.user?.fullName || "Khách vãng lai",
      barber: b.barber?.user?.fullName || "Chưa rõ",
      total: parseFloat(b.total || 0),
      date: b.bookingDate,
      time: b.bookingTime,
      status: b.status.toLowerCase(),
      method: b.paymentMethod === "Transfer" ? "transfer" : "cash"
    }));

    return {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: transactions
    };
  }

  /**
   * Thống kê tài chính cho Lễ tân tại Chi nhánh
   */
  async getStatsForReceptionist(idBranch, { dateFrom, dateTo, search } = {}) {
    const bookingWhere = {};

    // 🌟 ĐỒNG BỘ: Ép tính toán thống kê ngày hôm nay bằng DATE_FORMAT
    if (!dateFrom && !dateTo && !search) {
      const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
      
      bookingWhere[Op.and] = [
        db.sequelize.where(
          fn("DATE_FORMAT", col("bookingDate"), "%Y-%m-%d"),
          today
        )
      ];
    } else {
      if (dateFrom || dateTo) {
        if (dateFrom && dateTo) {
          bookingWhere.bookingDate = { [Op.between]: [`${dateFrom} 00:00:00`, `${dateTo} 23:59:59`] };
        } else if (dateFrom) {
          bookingWhere.bookingDate = { [Op.gte]: `${dateFrom} 00:00:00` };
        } else if (dateTo) {
          bookingWhere.bookingDate = { [Op.lte]: `${dateTo} 23:59:59` };
        }
      }
    }

    const [stats, cancelCount] = await Promise.all([
      db.Booking.findAll({
        attributes: [
          [fn("SUM", col("total")), "totalRev"],
          [fn("COUNT", col("idBooking")), "completedCount"],
          [fn("SUM", literal("CASE WHEN paymentMethod = 'Cash' THEN total ELSE 0 END")), "cashRev"],
          [fn("SUM", literal("CASE WHEN paymentMethod = 'Transfer' THEN total ELSE 0 END")), "transRev"]
        ],
        where: { ...bookingWhere, status: "Completed" },
        include: [{
          model: db.Barber,
          as: "barber",
          where: { idBranch: idBranch },
          required: true,
          attributes: []
        }],
        raw: true
      }),
      db.Booking.count({
        where: { ...bookingWhere, status: "Cancelled" },
        include: [{
          model: db.Barber,
          as: "barber",
          where: { idBranch: idBranch },
          required: true
        }]
      })
    ]);

    const result = stats[0] || {};

    return {
      totalRev: parseFloat(result.totalRev || 0),
      completedCount: parseInt(result.completedCount || 0),
      cashRev: parseFloat(result.cashRev || 0),
      transRev: parseFloat(result.transRev || 0),
      cancelCnt: cancelCount
    };
  }
}

export default new TransactionService();
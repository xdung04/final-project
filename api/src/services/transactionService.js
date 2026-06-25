import { Op, fn, col, literal } from "sequelize";
import db from "../models/index.js";

class TransactionService {
  /**
   * Helper xử lý khoảng thời gian (Từ dateFrom đến hết ngày hôm nay)
   */
_buildDateCondition(dateFrom) {
  // Lấy thời mốc hiện tại theo múi giờ VN
  const nay = new Date();
  
  // Tạo mốc kết thúc là 23:59:59 ngày hôm nay (Tính theo giờ VN)
  const endOfToday = new Date(nay.getFullYear(), nay.getMonth(), nay.getDate(), 23, 59, 59, 999);

  if (!dateFrom) {
    // Mặc định: Lấy từ 00:00:00 hôm nay -> 23:59:59 hôm nay
    const startOfToday = new Date(nay.getFullYear(), nay.getMonth(), nay.getDate(), 0, 0, 0, 0);
    return {
      [Op.between]: [startOfToday, endOfToday]
    };
  } else {
    // Nếu có dateFrom (Dạng chuỗi "YYYY-MM-DD" từ frontend gửi lên)
    const [year, month, day] = dateFrom.split("-").map(Number);
    // Tạo mốc từ 00:00:00 của ngày được chọn
    const startOfSelectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    return {
      [Op.between]: [startOfSelectedDate, endOfToday]
    };
  }
}

  /**
   * Lấy danh sách giao dịch cho Lễ tân theo Chi nhánh
   */
  async getTransactionsForReceptionist({ idBranch, search, dateFrom, statusFilter, methodFilter, page, limit }) {
    const offset = (page - 1) * limit;
    const bookingWhere = {};

    // 🌟 Áp dụng logic thời gian mới
    bookingWhere.bookingDate = this._buildDateCondition(dateFrom);

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

    // Tách riêng đếm & tối ưu hóa include
    const count = await db.Booking.count({
      where: bookingWhere,
      include: [
        {
          model: db.Customer,
          required: !!(search && isNaN(search)),
          include: [{ 
            model: db.User, 
            as: "user", 
            where: Object.keys(userCustomerWhere).length ? userCustomerWhere : undefined 
          }]
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
   * Thống kê tài chính cho Lễ tân tại Chi nhánh (Đồng bộ bộ lọc)
   */
  async getStatsForReceptionist(idBranch, { dateFrom, search, statusFilter, methodFilter } = {}) {
    const bookingWhere = {};

    // 🌟 Sử dụng chung hàm xử lý ngày để đảm bảo đồng bộ
    bookingWhere.bookingDate = this._buildDateCondition(dateFrom);

    // Đồng bộ thêm các bộ lọc từ frontend nếu có
    if (methodFilter && methodFilter !== "all") {
      const methodMap = { cash: "Cash", transfer: "Transfer" };
      bookingWhere.paymentMethod = methodMap[methodFilter];
    }
    
    if (search && !isNaN(search)) {
      bookingWhere.idBooking = Number(search);
    }

    const [stats, cancelCount] = await Promise.all([
      db.Booking.findAll({
        attributes: [
          [fn("SUM", col("total")), "totalRev"],
          [fn("COUNT", col("idBooking")), "completedCount"],
          [fn("SUM", literal("CASE WHEN paymentMethod = 'Cash' THEN total ELSE 0 END")), "cashRev"],
          [fn("SUM", literal("CASE WHEN paymentMethod = 'Transfer' THEN total ELSE 0 END")), "transRev"]
        ],
        // Giữ nguyên tính toán doanh thu cho đơn "Completed"
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
        // Giữ nguyên đếm số đơn "Cancelled"
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
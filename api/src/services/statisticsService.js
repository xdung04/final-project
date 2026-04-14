// services/statisticsService.js
import db from "../models/index.js";
import { Sequelize } from "sequelize";

/**
 * Thống kê doanh thu tất cả thợ theo chi nhánh
 * @param {Object} filter - { month, year, branchId }
 * @returns {Array} danh sách thợ và tổng doanh thu
 */
export const getBarberRevenue = async (filter = {}) => {
  const { month, year, branchId } = filter;

  // Lọc theo tháng/năm
  const whereSalary = {};
  if (month) whereSalary.month = month;
  if (year) whereSalary.year = year;

  // Lọc theo chi nhánh nếu có
  const whereBarber = {};
  if (branchId) whereBarber.idBranch = branchId;

  // Query từ Salary kết hợp với Barber
  const salaries = await db.Salary.findAll({
    where: whereSalary,
    include: [
      {
        model: db.Barber,
        as: "barber",
        where: whereBarber,
        attributes: ["idBarber", "idBranch"],
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["fullName"], // tên thợ nằm ở đây
          },
        ],
      },
    ],
    attributes: ["idSalary", "baseSalary", "commission", "tips", "bonus", "totalSalary"],
    order: [["year", "ASC"], ["month", "ASC"]],
  });

  return salaries.map((s) => ({
    barberName: s.barber.user.fullName,
    baseSalary: parseFloat(s.baseSalary),
    commission: parseFloat(s.commission),
    tips: parseFloat(s.tips),
    bonus: parseFloat(s.bonus),
    totalSalary: parseFloat(s.totalSalary),
  }));
};

/**
 * Thống kê doanh thu từng chi nhánh theo tháng
 * @param {Number} year - năm cần lấy
 * @returns {Array}
 */
export const getBranchMonthlyBookingRevenue = async (year) => {
  const revenue = await db.Booking.findAll({
    attributes: [
      [Sequelize.col("barber->branch.idBranch"), "branchId"],
      [Sequelize.col("barber->branch.name"), "branchName"],
      [Sequelize.literal("MONTH(`bookingDate`)"), "month"],
      [Sequelize.literal("SUM(`total`)"), "totalRevenue"],
    ],
    where: {
      isPaid: true,
      [Sequelize.Op.and]: Sequelize.where(
        Sequelize.fn("YEAR", Sequelize.col("bookingDate")),
        year
      ),
    },
    include: [
      {
        model: db.Barber,
        as: "barber",
        attributes: [],
        include: [
          {
            model: db.Branch,
            as: "branch",
            attributes: [],
          },
        ],
      },
    ],
    group: [
      "barber->branch.idBranch",
      "barber->branch.name",
      Sequelize.literal("MONTH(`bookingDate`)"),
    ],
    order: [
      ["barber", "branch", "idBranch", "ASC"],
      [Sequelize.literal("MONTH(`bookingDate`)"), "ASC"],
    ],
    raw: true,
  });

  return revenue.map((r) => ({
    branchId: r.branchId,
    branchName: r.branchName,
    month: r.month,
    totalRevenue: parseFloat(r.totalRevenue),
  }));
};

/* ---------------------------------------------------------------------- */
/* 🧮 CÁC HÀM THỐNG KÊ BỔ SUNG CHO DASHBOARD */
/* ---------------------------------------------------------------------- */

/**
 * Tổng doanh thu trong tháng (sum total booking đã thanh toán)
 */
export const getMonthlyRevenue = async (month, year) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const totalRevenue = await db.Booking.sum("total", {
    where: {
      isPaid: true,
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("bookingDate")), m),
        Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("bookingDate")), y),
      ],
    },
  });

  return Number(totalRevenue || 0);
};

/**
 * Tổng số khách hàng đã từng phục vụ (1 khách nhiều lần vẫn tính 1)
 */
export const getServedCustomerCount = async () => {
  const count = await db.Booking.count({
    distinct: true,
    col: "idCustomer",
    where: {
      idCustomer: { [Sequelize.Op.ne]: null },
    },
  });
  return Number(count || 0);
};

/**
 * Tổng số lượng booking từ trước đến giờ
 */
export const getTotalBookings = async () => {
  const now = new Date();
  const month = now.getMonth() + 1; // JS: 0 = January
  const year = now.getFullYear();

  const count = await db.Booking.count({
    where: {
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("bookingDate")), month),
        Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("bookingDate")), year),
      ],
    },
  });

  return Number(count || 0);
};

/**
 * Trung bình rating của tất cả thợ (từ bảng BarberRatingSummary)
 */
export const getAvgRating = async () => {
  const result = await db.BarberRatingSummary.findAll({
    attributes: [[Sequelize.fn("AVG", Sequelize.col("avgRate")), "overallAvg"]],
    raw: true,
  });

  const avg = result?.[0]?.overallAvg ?? 0;
  return Number(parseFloat(avg));
};

/**
 * Top 10 khách hàng tiềm năng theo tổng chi tiêu & số lần đến
 */
export const getTopCustomers = async (limit = 10) => {
  const customers = await db.Booking.findAll({
    attributes: [
      "idCustomer",
      [Sequelize.fn("SUM", Sequelize.col("total")), "totalSpent"],
      [Sequelize.fn("COUNT", Sequelize.col("idBooking")), "visitCount"],
    ],
    where: {
      idCustomer: { [Sequelize.Op.ne]: null },
    },
    include: [
      {
        model: db.Customer,
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["fullName", "email"],
          },
        ],
      },
    ],
    group: [
      "Booking.idCustomer",
      "customer.idCustomer",
      "customer.user.idUser",
    ],
    order: [
      [Sequelize.literal("totalSpent"), "DESC"],
      [Sequelize.literal("visitCount"), "DESC"],
    ],
    limit,
  });

  return customers.map((c) => ({
    idCustomer: c.idCustomer,
    fullName: c.Customer?.user?.fullName || null,
    email: c.Customer?.user?.email || null,
    totalSpent: Number(parseFloat(c.get("totalSpent") || 0)),
    visitCount: Number(parseInt(c.get("visitCount") || 0)),
  }));
};


/**
 * Tổng hợp tất cả số liệu dashboard trong 1 call
 */
export const getStatisticsOverview = async (month, year) => {
  const [
    monthlyRevenue,
    servedCustomerCount,
    totalBookings,
    avgRating,
    topCustomers,
  ] = await Promise.all([
    getMonthlyRevenue(month, year),
    getServedCustomerCount(),
    getTotalBookings(),
    getAvgRating(),
    getTopCustomers(),
  ]);

  return {
    monthlyRevenue,
    servedCustomerCount,
    totalBookings,
    avgRating,
    topCustomers,
  };
};

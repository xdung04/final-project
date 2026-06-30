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

  const whereSalary = {};
  if (month) whereSalary.month = month;
  if (year) whereSalary.year = year;

  const whereBarber = {};
  if (branchId) whereBarber.idBranch = branchId;

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
            attributes: ["fullName"],
          },
        ],
      },
    ],
    attributes: ["idSalary", "baseSalary", "commission", "tips", "bonus", "totalSalary"],
    order: [
      ["year", "ASC"],
      ["month", "ASC"],
    ],
  });

  return salaries.map((s) => ({
    barberId: s.barber.idBarber,        // ← thêm để frontend merge năm ngoái
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
export const getBranchMonthlyBookingRevenue = async (year, branchId = null) => {
  const revenue = await db.Booking.findAll({
    attributes: [
      [Sequelize.col("barber->branch.idBranch"), "branchId"],
      [Sequelize.col("barber->branch.name"), "branchName"],
      [Sequelize.literal("MONTH(`bookingDate`)"), "month"],
      [Sequelize.literal("SUM(`total`)"), "totalRevenue"],
    ],
    where: {
      isPaid: true,
      ...(branchId && {                  // ← thêm filter branchId
        "$barber.branch.idBranch$": branchId,
      }),
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
// Sửa getServedCustomerCount
// Logic: đếm distinct customer có tài khoản + đếm riêng booking vãng lai (idCustomer=0)
export const getServedCustomerCount = async (month, year) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const whereTime = {
    [Sequelize.Op.and]: [
      Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("bookingDate")), m),
      Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("bookingDate")), y),
    ],
    status: { [Sequelize.Op.notIn]: ["Cancelled"] },
  };

  // Đếm khách có tài khoản (idCustomer khác 0 và khác null)
  const registeredCount = await db.Booking.count({
    distinct: true,
    col: "idCustomer",
    where: {
      ...whereTime,
      idCustomer: {
        [Sequelize.Op.and]: [{ [Sequelize.Op.ne]: null }, { [Sequelize.Op.ne]: 0 }],
      },
    },
  });

  // Đếm từng lượt khách vãng lai (idCustomer = 0), mỗi booking = 1 khách
  const guestCount = await db.Booking.count({
    where: {
      ...whereTime,
      idCustomer: 0,
    },
  });

  return registeredCount + guestCount;
};

// Sửa getTotalBookings — chỉ đếm booking không bị hủy
export const getTotalBookings = async (month, year) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const count = await db.Booking.count({
    where: {
      status: { [Sequelize.Op.notIn]: ["Cancelled"] },
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("bookingDate")), m),
        Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("bookingDate")), y),
      ],
    },
  });

  return Number(count || 0);
};

// Sửa getAvgRating — tính từ booking trong tháng
export const getAvgRating = async (month, year) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  // Lấy avgRate của các barber có booking trong tháng
  const result = await db.BarberRatingSummary.findAll({
    attributes: [[Sequelize.fn("AVG", Sequelize.col("BarberRatingSummary.avgRate")), "overallAvg"]],
    include: [
      {
        model: db.Barber,
        as: "barber",
        attributes: [],
        required: true,
        include: [
          {
            model: db.Booking,
            as: "Bookings",
            attributes: [],
            required: true,
            where: {
              [Sequelize.Op.and]: [
                Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("barber->Bookings.bookingDate")), m),
                Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("barber->Bookings.bookingDate")), y),
              ],
            },
          },
        ],
      },
    ],
    raw: true,
  });

  const avg = result?.[0]?.overallAvg ?? 0;
  return Number(parseFloat(avg).toFixed(2));
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
    group: ["Booking.idCustomer", "customer.idCustomer", "customer.user.idUser"],
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
 * Doanh thu theo tuần trong tháng, tách theo chi nhánh
 * Trả về mảng 4 tuần, mỗi tuần có doanh thu từng chi nhánh
 */
export const getMonthlyRevenueChart = async (month, year) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  // Lấy tất cả chi nhánh
  const branches = await db.Branch.findAll({
    attributes: ["idBranch", "name"],
    order: [["idBranch", "ASC"]],
  });

  // Xác định số ngày trong tháng
  const daysInMonth = new Date(y, m, 0).getDate();

  // Chia 4 tuần
  const weeks = [
    { label: "Tuần 1", start: 1, end: 7 },
    { label: "Tuần 2", start: 8, end: 14 },
    { label: "Tuần 3", start: 15, end: 21 },
    { label: "Tuần 4", start: 22, end: daysInMonth },
  ];

  // Lấy booking đã thanh toán trong tháng, join barber -> branch
  const bookings = await db.Booking.findAll({
    attributes: [
      "bookingDate",
      "total",
      [Sequelize.col("barber->branch.idBranch"), "branchId"],
      [Sequelize.col("barber->branch.name"), "branchName"],
    ],
    where: {
      isPaid: true,
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("bookingDate")), m),
        Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("bookingDate")), y),
      ],
    },
    include: [
      {
        model: db.Barber,
        as: "barber",
        attributes: [],
        include: [{ model: db.Branch, as: "branch", attributes: [] }],
      },
    ],
    raw: true,
  });

  // Tổng hợp theo tuần x chi nhánh
  const result = weeks.map((w) => {
    const row = { name: w.label };

    branches.forEach((br) => {
      const total = bookings
        .filter((b) => {
          const day = new Date(b.bookingDate).getDate();
          return b.branchId === br.idBranch && day >= w.start && day <= w.end;
        })
        .reduce((sum, b) => sum + parseFloat(b.total || 0), 0);

      row[br.name] = Math.round(total);
    });

    return row;
  });

  return { weeks: result, branches: branches.map((b) => ({ idBranch: b.idBranch, name: b.name })) };
};

/**
 * Tỉ trọng dịch vụ theo số lượng booking detail trong tháng
 */
export const getServiceDistribution = async (month, year) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const result = await db.BookingDetail.findAll({
    attributes: [
      [Sequelize.col("service.name"), "name"],
      [Sequelize.fn("COUNT", Sequelize.col("BookingDetail.idBookingDetail")), "value"],
    ],
    include: [
      {
        model: db.Service,
        as: "service",
        attributes: [],
      },
      {
        model: db.Booking,
        as: "booking",
        attributes: [],
        where: {
          [Sequelize.Op.and]: [
            Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("booking.bookingDate")), m),
            Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("booking.bookingDate")), y),
          ],
        },
      },
    ],
    group: ["service.idService", "service.name"],
    order: [[Sequelize.literal("value"), "DESC"]],
    limit: 6,
    raw: true,
  });

  return result.map((r) => ({ name: r.name, value: parseInt(r.value) }));
};

/**
 * Top thợ xuất sắc theo doanh thu tháng
 */
export const getTopBarbers = async (month, year, limit = 5) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 1);

  const barbers = await db.Barber.findAll({
    attributes: [
      "idBarber",
      [Sequelize.fn("COALESCE", Sequelize.fn("SUM", Sequelize.col("Bookings.total")), 0), "revenue"],
    ],
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["fullName", "image"],
        required: true,
      },
      {
        model: db.BarberRatingSummary,
        as: "ratingSummary",
        attributes: ["avgRate"],
        required: false,
      },
      {
        model: db.Booking,
        as: "Bookings",
        attributes: [],
        required: false,
        where: {
          isPaid: true,
          bookingDate: { [Sequelize.Op.gte]: startDate, [Sequelize.Op.lt]: endDate },
        },
      },
    ],
    group: ["Barber.idBarber", "user.idUser", "ratingSummary.idBarber"],
    order: [[Sequelize.literal("revenue"), "DESC"]],
    limit,
    subQuery: false,
  });

  return barbers.map((b, index) => ({
    rank: index + 1,
    idBarber: b.idBarber,
    name: b.user?.fullName || "—",
    avatar: b.user?.image || "",
    revenue: parseFloat(b.get("revenue") || 0),
    rating: parseFloat(b.ratingSummary?.avgRate || 0),
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
    revenueChart,
    serviceDistribution,
    topBarbers,
  ] = await Promise.all([
    getMonthlyRevenue(month, year),
    getServedCustomerCount(month, year), // ← truyền month/year
    getTotalBookings(month, year), // ← truyền month/year
    getAvgRating(month, year), // ← truyền month/year
    getTopCustomers(),
    getMonthlyRevenueChart(month, year),
    getServiceDistribution(month, year),
    getTopBarbers(month, year),
  ]);

  return {
    monthlyRevenue,
    servedCustomerCount,
    totalBookings,
    avgRating,
    topCustomers,
    revenueChart,
    serviceDistribution,
    topBarbers,
  };
};

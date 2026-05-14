// api/src/services/customerStatsService.js
import db from "../models/index.js";
import { Op } from "sequelize";

// ========================= Helper =========================
function getLastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString("vi-VN", { month: "short", year: "numeric" }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }
  return months;
}

function computeAvgGap(bookings) {
  if (bookings.length < 2) return null;
  const sorted = [...bookings].sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));
  let totalGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalGap += (new Date(sorted[i].bookingDate) - new Date(sorted[i - 1].bookingDate)) / (1000 * 3600 * 24);
  }
  return totalGap / (sorted.length - 1);
}

// Phân loại khách hàng dựa trên TOÀN BỘ lịch sử booking (không giới hạn thời gian)
// Thứ tự ưu tiên: Inactive → New → Regular → Occasional
function classifyCustomerFull(bookings) {
  const total = bookings.length;
  if (total === 0) return null;
  const lastDate = bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))[0].bookingDate;
  const daysSinceLast = Math.floor((new Date() - new Date(lastDate)) / (1000 * 3600 * 24));
  const avgGap = computeAvgGap(bookings);

  // 1. Inactive: >= 2 booking, daysSinceLast >= 90
  if (total >= 2 && daysSinceLast >= 90) return "inactive";

  // 2. New: chỉ có 1 booking và booking đó trong tháng hiện tại
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  if (total === 1 && new Date(bookings[0].bookingDate) >= currentMonthStart) return "new";

  // 3. Regular: >= 6 booking, avgGap <= 35
  if (total >= 6 && avgGap !== null && avgGap <= 35) return "regular";

  // 4. Occasional: >= 2 booking, avgGap >= 40
  if (total >= 2 && avgGap !== null && avgGap >= 40) return "occasional";

  return "occasional"; // fallback
}

// ========================= Tổng quan =========================
export const getCustomerOverview = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    totalActive,
    totalWalkIn,
    newCustomersLast30Days,
    totalBookings,
    totalRevenue,
    avgPointsResult,
  ] = await Promise.all([
    db.User.count({ where: { role: "customer", isStatus: true } }),
    db.User.count({
      where: { role: "customer", isStatus: false, email: null, password: null, googleId: null },
    }),
    db.User.count({
      where: { role: "customer", isStatus: true, createdAt: { [Op.gte]: thirtyDaysAgo } },
    }),
    db.Booking.count({ where: { status: { [Op.ne]: "Cancelled" } } }),
    db.Booking.sum("total", { where: { status: { [Op.ne]: "Cancelled" } } }),
    db.Customer.findOne({
      attributes: [[db.sequelize.fn("AVG", db.sequelize.col("loyaltyPoint")), "average"]],
      include: [
        {
          model: db.User,
          as: "user",
          attributes: [],
          where: { role: "customer", isStatus: true },
          required: true,
        },
      ],
      raw: true,
    }),
  ]);

  const returningLast30Days = await db.Booking.count({
    where: { bookingDate: { [Op.gte]: thirtyDaysAgo }, status: { [Op.ne]: "Cancelled" } },
    distinct: true,
    col: "idCustomer",
  });

  return {
    totalActive,
    totalWalkIn,
    newCustomersLast30Days,
    returningLast30Days,
    totalBookings,
    totalRevenue: totalRevenue || 0,
    avgPoints: Math.round(avgPointsResult?.average || 0),
  };
};

// ========================= Biểu đồ 6 tháng =========================
export const getMonthlyCustomerStats = async (months = 6) => {
  const periods = getLastNMonths(months);
  const result = await Promise.all(
    periods.map(async ({ year, month, label, start, end }) => {
      const totalVisitors = await db.Booking.count({
        where: { bookingDate: { [Op.between]: [start, end] }, status: { [Op.ne]: "Cancelled" } },
        distinct: true,
        col: "idCustomer",
      });

      const visitorsThisMonth = await db.Booking.findAll({
        where: { bookingDate: { [Op.between]: [start, end] }, status: { [Op.ne]: "Cancelled" } },
        attributes: ["idCustomer"],
        group: ["idCustomer"],
        raw: true,
      });

      const customerIdsThisMonth = visitorsThisMonth.map((b) => b.idCustomer);
      let newCustomers = 0,
        returningCustomers = 0;

      if (customerIdsThisMonth.length > 0) {
        const hadPrevious = await db.Booking.findAll({
          where: {
            idCustomer: { [Op.in]: customerIdsThisMonth },
            bookingDate: { [Op.lt]: start },
            status: { [Op.ne]: "Cancelled" },
          },
          attributes: ["idCustomer"],
          group: ["idCustomer"],
          raw: true,
        });
        const returningIds = new Set(hadPrevious.map((b) => b.idCustomer));
        returningCustomers = returningIds.size;
        newCustomers = customerIdsThisMonth.length - returningCustomers;
      }

      const revenue = await db.Booking.sum("total", {
        where: { bookingDate: { [Op.between]: [start, end] }, status: { [Op.ne]: "Cancelled" } },
      });

      const returnRate = totalVisitors > 0 ? ((returningCustomers / totalVisitors) * 100).toFixed(1) : 0;

      return {
        month: label,
        year,
        monthNum: month,
        newCustomers,
        returningCustomers,
        totalVisitors,
        revenue: revenue || 0,
        returnRate: parseFloat(returnRate),
      };
    })
  );
  return result;
};

// ========================= At‑Risk (dùng cho gửi voucher) =========================
export const getAtRiskCustomers = async (days = 30, includeWalkIn = true) => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days);

  const customersWithLastBooking = await db.Booking.findAll({
    attributes: [
      "idCustomer",
      [db.sequelize.fn("MAX", db.sequelize.col("bookingDate")), "lastBookingDate"],
      [db.sequelize.fn("SUM", db.sequelize.col("total")), "totalSpend"],
    ],
    where: { status: { [Op.ne]: "Cancelled" } },
    group: ["idCustomer"],
    having: db.sequelize.where(db.sequelize.fn("MAX", db.sequelize.col("bookingDate")), "<", thresholdDate),
    raw: true,
  });

  let customerIds = customersWithLastBooking.map((c) => c.idCustomer);

  if (includeWalkIn) {
    const walkInUsers = await db.User.findAll({
      where: { role: "customer", isStatus: false, email: null, password: null, googleId: null },
      attributes: ["idUser"],
    });
    customerIds = [...new Set([...customerIds, ...walkInUsers.map((u) => u.idUser)])];
  }

  if (customerIds.length === 0) return [];

  const customers = await db.Customer.findAll({
    where: { idCustomer: { [Op.in]: customerIds } },
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["fullName", "email", "phoneNumber", "isStatus", "googleId"],
      },
    ],
    attributes: ["idCustomer", "loyaltyPoint"],
  });

  const result = customers.map((cust) => {
    const bookingInfo = customersWithLastBooking.find((b) => b.idCustomer === cust.idCustomer);
    const isWalkIn = !cust.user?.email && !cust.user?.googleId && cust.user?.isStatus === false;
    const daysAgo = bookingInfo
      ? Math.floor((new Date() - new Date(bookingInfo.lastBookingDate)) / (1000 * 3600 * 24))
      : null;

    return {
      id: cust.idCustomer,
      name: cust.user?.fullName || "Khách vãng lai",
      email: cust.user?.email || null,
      phone: cust.user?.phoneNumber || null,
      lastBookingDate: bookingInfo?.lastBookingDate || null,
      daysAgo,
      totalSpend: Number(bookingInfo?.totalSpend || 0),
      loyaltyPoint: cust.loyaltyPoint,
      isWalkIn,
    };
  });

  result.sort((a, b) => (b.daysAgo ?? Infinity) - (a.daysAgo ?? Infinity));
  return result;
};


export const getCustomerSegments = async () => {
  // 1. Xác định khoảng thời gian so sánh (MTD cùng kỳ)
  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = now;
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const currentDay = now.getDate();
  const targetPrevDay = Math.min(currentDay, daysInPrevMonth);
  const clampedPrevEnd = new Date(now.getFullYear(), now.getMonth() - 1, targetPrevDay, 23, 59, 59);
  const periods = {
    current: { start: currentStart, end: currentEnd },
    previous: { start: prevMonthStart, end: clampedPrevEnd },
  };

  // 2. Lấy tất cả customers + user
  const customers = await db.Customer.findAll({
    include: [
      {
        model: db.User,
        as: "user",
        required: true,
        where: { role: "customer" },
      },
    ],
    attributes: ["idCustomer", "loyaltyPoint"],
  });

  // 3. Lấy tất cả booking Completed (không huỷ)
  const allBookings = await db.Booking.findAll({
    where: { status: "Completed" },
    attributes: ["idCustomer", "bookingDate", "total"],
    raw: true,
  });

  const bookingMap = {};
  for (const b of allBookings) {
    if (!bookingMap[b.idCustomer]) bookingMap[b.idCustomer] = [];
    bookingMap[b.idCustomer].push(b);
  }

  // 4. Lấy thông tin voucher RETENTION cho từng khách
  const retentionVouchers = await db.Voucher.findAll({
    where: { type: "RETENTION", is_active: true },
    attributes: ["id"],
  });
  const retentionVoucherIds = retentionVouchers.map((v) => v.id);
  const allCustomerVouchers = await db.CustomerVoucher.findAll({
    where: {
      voucher_id: { [Op.in]: retentionVoucherIds },
      customer_id: { [Op.in]: customers.map((c) => c.idCustomer) },
    },
    attributes: ["customer_id", "voucher_id", "status", "expires_at", "used_at"],
  });

  const voucherInfoMap = {};
  for (const cv of allCustomerVouchers) {
    const cid = cv.customer_id;
    if (!voucherInfoMap[cid]) voucherInfoMap[cid] = { hasValid: false, usedCount: 0, expiredCount: 0 };
    if (cv.status === "AVAILABLE" && (!cv.expires_at || new Date(cv.expires_at) > new Date())) {
      voucherInfoMap[cid].hasValid = true;
    } else if (cv.status === "USED") {
      voucherInfoMap[cid].usedCount++;
    } else if (cv.status === "EXPIRED") {
      voucherInfoMap[cid].expiredCount++;
    }
  }

  // 5. Phân loại từng khách dựa trên TOÀN BỘ booking
  const allCustomersList = [];
  const segments = {
    "total-active": [],
    new: [],
    occasional: [],
    regular: [],
    inactive: [],
  };

  for (const cust of customers) {
    const custId = cust.idCustomer;
    const bookings = bookingMap[custId] || [];
    const segment = classifyCustomerFull(bookings);
    if (!segment) continue; // không có booking → không tính vào active (nhưng theo logic, khách không booking không nằm trong active)

    const completed = bookings;
    const lastBooking = completed.length
      ? completed.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))[0]
      : null;
    const daysAgo = lastBooking ? Math.floor((now - new Date(lastBooking.bookingDate)) / (1000 * 3600 * 24)) : null;
    const totalSpend = completed.reduce((s, b) => s + Number(b.total), 0);
    const avgGap = computeAvgGap(completed);

    const custData = {
      id: custId,
      name: cust.user.fullName,
      phone: cust.user.phoneNumber,
      email: cust.user.email,
      loyaltyPoint: cust.loyaltyPoint,
      totalBookings: completed.length,
      totalSpend,
      lastBookingDate: lastBooking ? lastBooking.bookingDate : null,
      daysAgo,
      avgGap,
      segment,
      joinedAt: cust.user.createdAt,
      voucherStatus: (() => {
        const info = voucherInfoMap[custId] || { hasValid: false, usedCount: 0, expiredCount: 0 };
        return {
          hasValid: info.hasValid,
          usedCount: info.usedCount,
          expiredCount: info.expiredCount,
          type: info.hasValid ? "A" : info.usedCount > 0 ? "B" : "C",
        };
      })(),
    };

    allCustomersList.push(custData);
    if (segment !== "inactive") segments["total-active"].push(custData);
    segments[segment].push(custData);
  }

  // 6. Số lượng segment hiện tại
  const currentCounts = {
    new: segments.new.length,
    occasional: segments.occasional.length,
    regular: segments.regular.length,
    inactive: segments.inactive.length,
  };

  // 7. Số lượng segment tháng trước (cùng kỳ)
  const prevBookingsByCustomer = {};
  for (const b of allBookings) {
    const bd = new Date(b.bookingDate);
    if (bd >= periods.previous.start && bd <= periods.previous.end) {
      if (!prevBookingsByCustomer[b.idCustomer]) prevBookingsByCustomer[b.idCustomer] = [];
      prevBookingsByCustomer[b.idCustomer].push(b);
    }
  }
  const prevCounts = { new: 0, occasional: 0, regular: 0, inactive: 0 };
  for (const cust of customers) {
    const prevBookings = prevBookingsByCustomer[cust.idCustomer] || [];
    const seg = classifyCustomerFull(prevBookings);
    if (seg && prevCounts.hasOwnProperty(seg)) prevCounts[seg]++;
  }

  // 8. % thay đổi
  const changes = {};
  for (const key of ["new", "occasional", "regular", "inactive"]) {
    const prev = prevCounts[key] || 0;
    const curr = currentCounts[key];
    changes[key] = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
  }

  // 9. Retention rate của New (khách New tháng trước có quay lại trong tháng này không)
  const newPrevCustomers = [];
  for (const cust of customers) {
    const prevBookings = prevBookingsByCustomer[cust.idCustomer] || [];
    const segPrev = classifyCustomerFull(prevBookings);
    if (segPrev === "new") newPrevCustomers.push(cust.idCustomer);
  }
  let retained = 0;
  for (const cid of newPrevCustomers) {
    const hasBookingCurrent = (bookingMap[cid] || []).some((b) => {
      const bd = new Date(b.bookingDate);
      return bd >= periods.current.start && bd <= periods.current.end;
    });
    if (hasBookingCurrent) retained++;
  }
  const retentionRate = newPrevCustomers.length > 0 ? (retained / newPrevCustomers.length) * 100 : 0;

  // 10. Occasional warning: số khách occasional có daysAgo >= 60
  const occasionalDanger = segments.occasional.filter((c) => c.daysAgo !== null && c.daysAgo >= 60).length;

  // 11. Đóng góp doanh thu của Regular trong tháng hiện tại (MTD)
  let regularRevenueCurrent = 0;
  let totalRevenueCurrent = 0;
  for (const cust of allCustomersList) {
    const custCurrentSpend = (bookingMap[cust.id] || [])
      .filter((b) => {
        const bd = new Date(b.bookingDate);
        return bd >= periods.current.start && bd <= periods.current.end;
      })
      .reduce((s, b) => s + Number(b.total), 0);
    if (cust.segment === "regular") regularRevenueCurrent += custCurrentSpend;
    totalRevenueCurrent += custCurrentSpend;
  }
  const regularRevenuePercent = totalRevenueCurrent > 0 ? (regularRevenueCurrent / totalRevenueCurrent) * 100 : 0;

  // 12. Total active (tất cả khách có ít nhất 1 booking, trừ inactive)
  const totalActive = allCustomersList.filter((c) => c.segment !== "inactive").length;
  const walkInCount = await db.User.count({
    where: { role: "customer", isStatus: false, email: null, password: null, googleId: null },
  });

  return {
    summary: {
      totalActive,
      walkInCount,
      new: currentCounts.new,
      occasional: currentCounts.occasional,
      regular: currentCounts.regular,
      inactive: currentCounts.inactive,
      changes,
      retentionRate,
      occasionalDanger,
      regularRevenuePercent,
    },
    segments,
  };
};
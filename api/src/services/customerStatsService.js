// api/src/services/customerStatsService.js
import db from "../models/index.js";
import { Op } from "sequelize";

// ========================= Helpers =========================
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
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.bookingDate) - new Date(b.bookingDate)
  );
  let totalGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalGap +=
      (new Date(sorted[i].bookingDate) - new Date(sorted[i - 1].bookingDate)) /
      (1000 * 3600 * 24);
  }
  return totalGap / (sorted.length - 1);
}

/**
 * Phân loại tại thời điểm "hiện tại" (now).
 * Thứ tự: New → Regular → Occasional → Inactive
 *
 * [BUG FIX 1] Spec "New" = booking ĐẦU TIÊN của khách nằm trong tháng hiện tại.
 * Không giới hạn tổng booking = 1. Khách có 2+ booking vẫn là New nếu
 * booking đầu tiên (sorted[0]) nằm trong tháng này.
 */
function classifyCustomerFull(bookings) {
  if (!bookings || bookings.length === 0) return null;

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.bookingDate) - new Date(b.bookingDate)
  );
  const total = sorted.length;
  const firstDate = new Date(sorted[0].bookingDate);
  const lastDate  = new Date(sorted[total - 1].bookingDate);

  const now = new Date();
  const daysSinceLast = Math.floor((now - lastDate) / (1000 * 3600 * 24));
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. New: booking ĐẦU TIÊN nằm trong tháng hiện tại
  if (firstDate >= currentMonthStart) return "new";

  // 2. Regular: >= 4 booking VÀ lần cuối <= 45 ngày
  if (total >= 4 && daysSinceLast <= 45) return "regular";

  // 3. Inactive: lần cuối > 90 ngày
  if (daysSinceLast > 90) return "inactive";

  // 4. Occasional: còn lại (lần cuối <= 90 ngày, không thỏa Regular/New)
  return "occasional";
}

/**
 * Phân loại tại snapshot (dùng cho % change tháng trước & retention).
 * atDate: thời điểm cuối kỳ so sánh (thay thế "now").
 *
 * [BUG FIX 2] Nhất quán với classifyCustomerFull:
 * New = booking đầu tiên nằm trong tháng của atDate (không giới hạn total = 1).
 */
function classifyCustomerFullAt(bookings, atDate) {
  if (!bookings || bookings.length === 0) return null;

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.bookingDate) - new Date(b.bookingDate)
  );
  const total = sorted.length;
  const firstDate = new Date(sorted[0].bookingDate);
  const lastDate  = new Date(sorted[total - 1].bookingDate);

  const daysSinceLast = Math.floor((atDate - lastDate) / (1000 * 3600 * 24));
  const monthStart = new Date(atDate.getFullYear(), atDate.getMonth(), 1);

  // 1. New: booking đầu tiên trong tháng của atDate
  if (firstDate >= monthStart) return "new";

  // 2. Regular
  if (total >= 4 && daysSinceLast <= 45) return "regular";

  // 3. Inactive
  if (daysSinceLast > 90) return "inactive";

  // 4. Occasional
  return "occasional";
}

// ========================= Biểu đồ 6 tháng =========================
export const getMonthlyCustomerStats = async (months = 6) => {
  const periods = getLastNMonths(months);
  const result = await Promise.all(
    periods.map(async ({ year, month, label, start, end }) => {
      const visitorsThisMonth = await db.Booking.findAll({
        where: {
          bookingDate: { [Op.between]: [start, end] },
          status: { [Op.ne]: "Cancelled" },
        },
        attributes: ["idCustomer"],
        group: ["idCustomer"],
        raw: true,
      });

      const customerIdsThisMonth = visitorsThisMonth.map((b) => b.idCustomer);
      let newCustomers = 0;
      let returningCustomers = 0;

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

      const totalVisitors = customerIdsThisMonth.length;
      const revenue = await db.Booking.sum("total", {
        where: {
          bookingDate: { [Op.between]: [start, end] },
          status: { [Op.ne]: "Cancelled" },
        },
      });
      const returnRate =
        totalVisitors > 0
          ? ((returningCustomers / totalVisitors) * 100).toFixed(1)
          : 0;

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

// ========================= Phân loại segment =========================
export const getCustomerSegments = async () => {
  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = now;
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const targetPrevDay = Math.min(now.getDate(), daysInPrevMonth);
  const prevEnd = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    targetPrevDay,
    23, 59, 59
  );

  // 1. Lấy tất cả customers + user
  const customers = await db.Customer.findAll({
    include: [
      {
        model: db.User,
        as: "user",
        required: true,
        where: { role: "customer" },
        attributes: ["fullName", "email", "phoneNumber", "isStatus", "createdAt", "googleId"],
      },
    ],
    attributes: ["idCustomer", "loyaltyPoint"],
  });

  // 2. Lấy tất cả booking Completed
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

  // 3. Voucher RETENTION
  const retentionVouchers = await db.Voucher.findAll({
    where: { type: "RETENTION", is_active: true },
    attributes: ["id"],
  });
  const retentionVoucherIds = retentionVouchers.map((v) => v.id);

  const allCustomerVouchers =
    retentionVoucherIds.length > 0
      ? await db.CustomerVoucher.findAll({
          where: {
            voucher_id: { [Op.in]: retentionVoucherIds },
            customer_id: { [Op.in]: customers.map((c) => c.idCustomer) },
          },
          attributes: ["customer_id", "voucher_id", "status", "expires_at", "used_at"],
        })
      : [];

  const voucherInfoMap = {};
  for (const cv of allCustomerVouchers) {
    const cid = cv.customer_id;
    if (!voucherInfoMap[cid])
      voucherInfoMap[cid] = { hasValid: false, usedCount: 0 };
    if (
      cv.status === "AVAILABLE" &&
      (!cv.expires_at || new Date(cv.expires_at) > now)
    ) {
      voucherInfoMap[cid].hasValid = true;
    } else if (cv.status === "USED") {
      voucherInfoMap[cid].usedCount++;
    }
  }

  // Helper tạo custData
  const buildCustData = (cust, bookings, segment) => {
    const sorted = [...bookings].sort(
      (a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)
    );
    const lastBooking = sorted[0] || null;
    const daysAgo = lastBooking
      ? Math.floor((now - new Date(lastBooking.bookingDate)) / (1000 * 3600 * 24))
      : null;
    const totalSpend = bookings.reduce((s, b) => s + Number(b.total), 0);
    const info = voucherInfoMap[cust.idCustomer] || { hasValid: false, usedCount: 0 };
    const voucherType = info.hasValid ? "A" : info.usedCount > 0 ? "B" : "C";

    return {
      id: cust.idCustomer,
      name: cust.user.fullName,
      phone: cust.user.phoneNumber,
      email: cust.user.email,
      loyaltyPoint: cust.loyaltyPoint,
      totalBookings: bookings.length,
      totalSpend,
      lastBookingDate: lastBooking ? lastBooking.bookingDate : null,
      daysAgo,
      avgGap: computeAvgGap(bookings),
      segment,
      joinedAt: cust.user.createdAt,
      voucherStatus: { type: voucherType, usedCount: info.usedCount },
    };
  };

  // 4. Phân loại từng khách
  const segments = { new: [], occasional: [], regular: [], inactive: [] };
  const allClassified = [];

  for (const cust of customers) {
    const custId = cust.idCustomer;
    const bookings = bookingMap[custId] || [];

    // [BUG FIX 3] Khách 0 booking → Inactive (theo spec)
    // Code cũ: `if (!segment) continue` → bỏ qua hoàn toàn
    const segment = classifyCustomerFull(bookings) ?? "inactive";

    const custData = buildCustData(cust, bookings, segment);
    allClassified.push(custData);
    segments[segment].push(custData);
  }

  // 5. Tổng active = New + Regular + Occasional (không gồm Inactive)
  const totalActive = allClassified.filter((c) => c.segment !== "inactive").length;

  // 6. Khách chưa kích hoạt
  const walkInCount = await db.User.count({
    where: {
      role: "customer",
      isStatus: false,
      email: null,
      password: null,
      googleId: null,
    },
  });

  // 7. % change so với tháng trước (snapshot tại prevEnd)
  const prevCounts = { new: 0, occasional: 0, regular: 0, inactive: 0 };
  for (const cust of customers) {
    const custId = cust.idCustomer;
    const bookingsUpToPrev = (bookingMap[custId] || []).filter(
      (b) => new Date(b.bookingDate) <= prevEnd
    );
    // [BUG FIX 3 kết hợp] Khách 0 booking tại tháng trước → inactive snapshot
    const segPrev = classifyCustomerFullAt(bookingsUpToPrev, prevEnd) ?? "inactive";
    if (prevCounts.hasOwnProperty(segPrev)) prevCounts[segPrev]++;
  }

  const currentCounts = {
    new: segments.new.length,
    occasional: segments.occasional.length,
    regular: segments.regular.length,
    inactive: segments.inactive.length,
  };

  const changes = {};
  for (const key of ["new", "occasional", "regular", "inactive"]) {
    const prev = prevCounts[key] || 0;
    const curr = currentCounts[key];
    changes[key] =
      prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
  }

  // 8. Retention rate: khách New tháng trước có booking trong tháng này
  // [BUG FIX 2 kết hợp] classifyCustomerFullAt đã dùng đúng logic New (firstDate)
  const newPrevIds = [];
  for (const cust of customers) {
    const custId = cust.idCustomer;
    const bookingsUpToPrev = (bookingMap[custId] || []).filter(
      (b) => new Date(b.bookingDate) <= prevEnd
    );
    if (classifyCustomerFullAt(bookingsUpToPrev, prevEnd) === "new") {
      newPrevIds.push(custId);
    }
  }
  let retained = 0;
  for (const cid of newPrevIds) {
    const hasCurrentBooking = (bookingMap[cid] || []).some((b) => {
      const bd = new Date(b.bookingDate);
      return bd >= currentStart && bd <= currentEnd;
    });
    if (hasCurrentBooking) retained++;
  }
  const retentionRate =
    newPrevIds.length > 0 ? (retained / newPrevIds.length) * 100 : 0;

  // 9. Occasional sắp inactive: daysAgo >= 60
  const occasionalDanger = segments.occasional.filter(
    (c) => c.daysAgo !== null && c.daysAgo >= 60
  ).length;

  // 10. Đóng góp doanh thu Regular tháng hiện tại
  let regularRevenueCurrent = 0;
  let totalRevenueCurrent = 0;
  for (const cust of allClassified) {
    const custCurrentSpend = (bookingMap[cust.id] || [])
      .filter((b) => {
        const bd = new Date(b.bookingDate);
        return bd >= currentStart && bd <= currentEnd;
      })
      .reduce((s, b) => s + Number(b.total), 0);
    if (cust.segment === "regular") regularRevenueCurrent += custCurrentSpend;
    totalRevenueCurrent += custCurrentSpend;
  }
  const regularRevenuePercent =
    totalRevenueCurrent > 0
      ? (regularRevenueCurrent / totalRevenueCurrent) * 100
      : 0;

  // 11. Inactive chưa nhận voucher (Type C)
  const inactiveReadyCount = segments.inactive.filter(
    (c) => c.voucherStatus.type === "C"
  ).length;

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
      inactiveReadyCount,
    },
    segments,
  };
};
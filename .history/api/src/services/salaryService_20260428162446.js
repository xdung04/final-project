// services/salaryService.js — REFACTORED

import db from "../models/index.js";
import { fn, col, Op } from "sequelize";
import { createNotification } from "./notificationService.js";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Tính lại deductions + netSalary từ bảng salary_deductions
// Dùng chung cho addDeduction và removeDeduction
// ═══════════════════════════════════════════════════════════════════════════
const recalculateSalary = async (idSalary, transaction) => {
  // Chỉ SUM các khoản chưa bị soft delete
  const result = await db.SalaryDeduction.findOne({
    where: { idSalary, deletedAt: null },
    attributes: [[fn("COALESCE", fn("SUM", col("amount")), 0), "totalDeductions"]],
    raw: true,
    transaction,
  });

  const totalDeductions = parseFloat(result?.totalDeductions || 0);

  const salary = await db.Salary.findByPk(idSalary, { transaction });
  const netSalary = parseFloat(salary.totalSalary) - totalDeductions;

  await salary.update({ deductions: totalDeductions, netSalary }, { transaction });

  return { totalDeductions, netSalary };
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. TÍNH LƯƠNG REALTIME (không lưu DB) — Dùng để preview
// ═══════════════════════════════════════════════════════════════════════════
export const calculateRealtimeSalaries = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // ── BƯỚC 1: Lấy Thống Kê (Doanh Thu, Tips, Số Khách) ──
  const stats = await db.Barber.findAll({
    attributes: [
      "idBarber",
      [fn("COALESCE", fn("SUM", col("Bookings.BookingDetails.price")), 0), "serviceRevenue"],
      [fn("COALESCE", fn("SUM", col("Bookings.BookingTip.tipAmount")), 0), "tipAmount"],
      [fn("COUNT", fn("DISTINCT", col("Bookings.idBooking"))), "customerCount"],
    ],
    include: [{
      model: db.Booking,
      as: "Bookings",
      required: false,
      where: { isPaid: true, bookingDate: { [Op.gte]: startDate, [Op.lt]: endDate } },
      attributes: [],
      include: [
        { model: db.BookingDetail, as: "BookingDetails", attributes: [] },
        { model: db.BookingTip, as: "BookingTip", attributes: [] },
      ],
    }],
    group: ["Barber.idBarber"],
    raw: true,
  });

  const statsMap = {};
  stats.forEach((s) => {
    statsMap[s.idBarber] = {
      serviceRevenue: parseFloat(s.serviceRevenue || 0),
      tipAmount: parseFloat(s.tipAmount || 0),
      customerCount: parseInt(s.customerCount || 0),
    };
  });

  // ── BƯỚC 2: Lấy Thông tin Thợ + Hợp đồng + Rating ──
  const barbers = await db.Barber.findAll({
    include: [
      { model: db.User,   as: "user",   attributes: ["idUser", "fullName"], required: true },
      { model: db.Branch, as: "branch", attributes: ["name"],               required: false },
      { model: db.BarberRatingSummary, as: "ratingSummary",                 required: false },
      {
        model: db.SalaryContract,
        as: "contracts",
        where: { status: "active" },
        required: false,
        include: [{
          model: db.CompensationPlan,
          as: "plan",
          include: [
            { model: db.CommissionRule, as: "commissionRules" },
            { model: db.BonusRule,      as: "bonusRules" },
          ],
        }],
      },
    ],
  });

  // ── BƯỚC 3: Ráp mạch — Tính lương từng thợ ──
  return barbers.map((b) => {
    const bStats        = statsMap[b.idBarber] || { serviceRevenue: 0, tipAmount: 0, customerCount: 0 };
    const serviceRevenue = bStats.serviceRevenue;
    const tipAmount      = bStats.tipAmount;
    const customerCount  = bStats.customerCount;
    const averageRating  = b.ratingSummary ? parseFloat(b.ratingSummary.avgRate || 0) : 0;

    let baseSalary = 0;
    let commission = 0;
    let bonus      = 0;

    const contract = b.contracts?.[0] || null;
    if (contract) {
      baseSalary = parseFloat(contract.actualBaseSalary || 0);

      const plan = contract.plan;
      if (plan) {
        // Hoa hồng bậc thang
        if (plan.commissionRules?.length > 0) {
          const matched = plan.commissionRules.find(
            (r) =>
              serviceRevenue >= parseFloat(r.minRevenueStep) &&
              (r.maxRevenueStep == null || serviceRevenue <= parseFloat(r.maxRevenueStep))
          );
          if (matched) commission = serviceRevenue * (parseFloat(matched.commissionRate) / 100);
        }

        // Thưởng KPI
        if (plan.bonusRules?.length > 0) {
          plan.bonusRules.forEach((rule) => {
            if (customerCount >= rule.minCustomerCount && averageRating >= parseFloat(rule.minAverageRating)) {
              bonus += parseFloat(rule.rewardAmount);
            }
          });
        }
      }
    }

    return {
      idBarber: b.idBarber,
      idUser:   b.user?.idUser,
      barberName: b.user?.fullName || "N/A",
      branchName: b.branch?.name  || "",
      month,
      year,
      customerCount,
      averageRating,
      serviceRevenue,
      baseSalary,
      commission,
      tip: tipAmount,
      bonus,
      // Realtime chưa có idSalary và khấu trừ
      idSalary:     null,
      deductions:   0,
      DeductionsList: [],
      status:       "Realtime",
      disputeCount: 0,
      disputeReason: null,
      deadlineAt:   null,
      paidAmount:   0,
    };
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. Lấy lương từ DB (đã tính/đã lưu)
// ═══════════════════════════════════════════════════════════════════════════
export const getSavedSalaries = async (month, year) => {
  const savedSalaries = await db.Salary.findAll({
    where: { month, year },
    include: [
      {
        model: db.Barber,
        as: "barber",
        include: [
          { model: db.User,   as: "user",   attributes: ["idUser", "fullName"] },
          { model: db.Branch, as: "branch", attributes: ["name"] },
        ],
      },
      {
        // Chỉ lấy khoản khấu trừ còn hiệu lực (chưa soft delete)
        model: db.SalaryDeduction,
        as: "DeductionsList",
        where: { deletedAt: null },
        required: false,
        attributes: ["idDeduction", "amount", "reason", "createdAt"],
      },
    ],
    order: [["idBarber", "ASC"]],
  });

  return savedSalaries.map((s) => ({
    // ── Định danh ──
    idSalary:   s.idSalary,
    idBarber:   s.idBarber,
    idUser:     s.barber?.user?.idUser,
    barberName: s.barber?.user?.fullName || "N/A",
    branchName: s.barber?.branch?.name  || "",
    month:      s.month,
    year:       s.year,

    // ── Thu nhập ──
    serviceRevenue: parseFloat(s.serviceRevenue || 0),
    baseSalary:     parseFloat(s.baseSalary),
    commission:     parseFloat(s.commission),
    tip:            parseFloat(s.tips),
    bonus:          parseFloat(s.bonus),
    totalSalary:    parseFloat(s.totalSalary),

    // ── Khấu trừ — lấy từ cached column + trả về list chi tiết cho frontend ──
    deductions:     parseFloat(s.deductions || 0),
    netSalary:      parseFloat(s.netSalary  || 0),
    DeductionsList: s.DeductionsList || [],

    // ── Workflow ──
    status:        s.status,
    disputeCount:  s.disputeCount  || 0,
    disputeReason: s.disputeReason || null,
    deadlineAt:    s.deadlineAt    || null,
    paidAmount:    s.paidAmount    || 0,
  }));
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. API CHO FRONTEND — Logic tổng hợp
// ═══════════════════════════════════════════════════════════════════════════
export const getSalariesForDisplay = async (month, year) => {
  const today        = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear  = today.getFullYear();
  const isCurrentMonth = month === currentMonth && year === currentYear;

  const savedData = await getSavedSalaries(month, year);

  if (savedData.length > 0) {
    return { source: "database", isCurrentMonth, canCalculate: false, salaries: savedData };
  }

  const realtimeData = await calculateRealtimeSalaries(month, year);

  if (isCurrentMonth) {
    return {
      source: "realtime",
      isCurrentMonth: true,
      canCalculate: false,
      message: "Dữ liệu realtime — Chưa hết tháng, chỉ xem được",
      salaries: realtimeData,
    };
  }

  return {
    source: "realtime",
    isCurrentMonth: false,
    canCalculate: true,
    message: "Preview tháng trước — Bấm 'Tính lương nháp' để lưu vào DB",
    salaries: realtimeData,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. Tính lương & Lưu Nháp (Draft)
// ═══════════════════════════════════════════════════════════════════════════
export const createDraftSalaries = async (month, year) => {
  const today        = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear  = today.getFullYear();

  if (year > currentYear || (year === currentYear && month >= currentMonth)) {
    throw new Error("Không thể tính lương cho tháng hiện tại hoặc tương lai!");
  }

  const existing = await db.Salary.findAll({ where: { month, year } });
  if (existing.length > 0) throw new Error("Tháng này đã tính lương rồi! Không thể tính lại.");

  const realtimeData = await calculateRealtimeSalaries(month, year);
  const transaction  = await db.sequelize.transaction();

  try {
    const salariesToCreate = realtimeData.map((s) => ({
      idBarber:       s.idBarber,
      month,
      year,
      serviceRevenue: s.serviceRevenue,
      baseSalary:     s.baseSalary,
      commission:     s.commission,
      tips:           s.tip,
      bonus:          s.bonus,
      totalSalary:    s.baseSalary + s.commission + s.tip + s.bonus,
      deductions:     0,
      netSalary:      s.baseSalary + s.commission + s.tip + s.bonus,
      status:         "Draft",
      disputeCount:   0,
    }));

    await db.Salary.bulkCreate(salariesToCreate, { transaction });
    await transaction.commit();

    return { success: true, count: salariesToCreate.length };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. Gửi Phiếu Lương (Draft → Pending)
// ═══════════════════════════════════════════════════════════════════════════
export const sendPayslip = async (idSalary) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber", include: [{ model: db.User, as: "user" }] }],
  });

  if (!salary) throw new Error("Không tìm thấy phiếu lương");
  if (!["Draft", "Disputed"].includes(salary.status)) {
    throw new Error(`Chỉ có thể gửi phiếu ở trạng thái Draft/Disputed, hiện tại: ${salary.status}`);
  }

  const now      = new Date();
  const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  await salary.update({ status: "Pending", sentAt: now, deadlineAt: deadline });

  if (salary.barber?.user?.idUser) {
    await createNotification({
      type:       "SALARY",
      title:      `Phiếu lương tháng ${salary.month}/${salary.year}`,
      content:    "Quản lý đã gửi phiếu lương. Vui lòng xác nhận trong 48h tới.",
      targetRole: "barber",
      targetId:   salary.barber.user.idUser,
      referenceId: salary.idSalary,
    });
  }

  return salary;
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. Thêm khoản khấu trừ mới (ACCUMULATE — không ghi đè)
// ═══════════════════════════════════════════════════════════════════════════
export const addDeduction = async (idSalary, { amount, reason }) => {
  if (!amount || Number(amount) <= 0) throw new Error("Số tiền phải lớn hơn 0");
  if (!reason?.trim())                throw new Error("Lý do khấu trừ là bắt buộc");

  const transaction = await db.sequelize.transaction();
  try {
    const salary = await db.Salary.findByPk(idSalary, { transaction });
    if (!salary) throw new Error("Không tìm thấy phiếu lương");
    if (["Paid", "Locked", "Cancelled"].includes(salary.status)) {
      throw new Error("Phiếu lương đã khóa, không thể điều chỉnh");
    }

    // Tạo khoản khấu trừ mới
    const deduction = await db.SalaryDeduction.create(
      { idSalary, amount: Number(amount), reason: reason.trim() },
      { transaction }
    );

    // Tính lại tổng và cập nhật cached columns
    const { totalDeductions, netSalary } = await recalculateSalary(idSalary, transaction);

    await transaction.commit();

    return {
      deduction,
      summary: { totalDeductions, netSalary },
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. Xóa mềm một khoản khấu trừ (có lý do — audit trail)
// ═══════════════════════════════════════════════════════════════════════════
export const removeDeduction = async (idDeduction, { deleteReason }) => {
  if (!deleteReason?.trim()) throw new Error("Lý do xóa là bắt buộc");

  const transaction = await db.sequelize.transaction();
  try {
    const deduction = await db.SalaryDeduction.findByPk(idDeduction, { transaction });
    if (!deduction)          throw new Error("Không tìm thấy khoản khấu trừ");
    if (deduction.deletedAt) throw new Error("Khoản khấu trừ này đã bị xóa rồi");

    // Kiểm tra salary status
    const salary = await db.Salary.findByPk(deduction.idSalary, { transaction });
    if (!salary) throw new Error("Không tìm thấy phiếu lương");
    if (!["Draft", "Disputed"].includes(salary.status)) {
      throw new Error(`Chỉ được xóa khấu trừ khi phiếu ở trạng thái Draft/Disputed, hiện tại: ${salary.status}`);
    }

    // Soft delete
    await deduction.update(
      { deletedAt: new Date(), deleteReason: deleteReason.trim() },
      { transaction }
    );

    // Tính lại tổng và cập nhật cached columns
    const { totalDeductions, netSalary } = await recalculateSalary(deduction.idSalary, transaction);

    await transaction.commit();

    return {
      idDeduction,
      summary: { totalDeductions, netSalary },
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. Force-close Khiếu nại
// ═══════════════════════════════════════════════════════════════════════════
export const forceCloseSalaryDispute = async (idSalary, reason) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber", include: [{ model: db.User, as: "user" }] }],
  });

  if (!salary || salary.status !== "Disputed") {
    throw new Error("Chỉ có thể force-close phiếu đang Disputed");
  }

  // FIX: Bỏ adjustmentNote (đã xóa cột), chỉ update status + disputeReason
  await salary.update({
    status:        "Confirmed",
    disputeReason: `[Admin từ chối]: ${reason}`,
  });

  if (salary.barber?.user?.idUser) {
    await createNotification({
      type:       "SALARY",
      title:      "Khiếu nại đã bị đóng",
      content:    `Quản lý: ${reason}`,
      targetRole: "barber",
      targetId:   salary.barber.user.idUser,
      referenceId: salary.idSalary,
    });
  }

  return salary;
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. Thanh toán & Khóa sổ
// ═══════════════════════════════════════════════════════════════════════════
export const markAsPaid = async (idSalary, { paidAmount, paymentProofUrl }) => {
  const salary = await db.Salary.findByPk(idSalary);
  if (!salary) throw new Error("Không tìm thấy phiếu lương");

  if (!["Confirmed", "AutoConfirmed"].includes(salary.status)) {
    throw new Error("Chỉ được thanh toán phiếu đã Confirmed");
  }

  await salary.update({ paidAmount, paymentProofUrl, status: "Paid" });
  return salary;
};

// ═══════════════════════════════════════════════════════════════════════════
// BARBER APIs
// ═══════════════════════════════════════════════════════════════════════════
export const getMyPayslips = async (idBarber) => {
  const salaries = await db.Salary.findAll({
    where: {
      idBarber,
      status: { [Op.ne]: "Draft" },
    },
    include: [
      {
        model: db.SalaryDeduction,
        as: "DeductionsList",
        where: { deletedAt: null },
        required: false,
        attributes: ["idDeduction", "amount", "reason", "createdAt"],
      },
    ],
    order: [["year", "DESC"], ["month", "DESC"]],
  });

  const detailedSalaries = await Promise.all(
    salaries.map(async (salary) => {
      const startDate = new Date(salary.year, salary.month - 1, 1);
      const endDate   = new Date(salary.year, salary.month,     1);

      const bookings = await db.Booking.findAll({
        where: {
          idBarber: salary.idBarber,
          isPaid: true,
          bookingDate: { [Op.gte]: startDate, [Op.lt]: endDate },
        },
        include: [
          {
            model: db.BookingDetail,
            as: "BookingDetails",
            include: [{ model: db.Service, as: "service", attributes: ["name"] }],
          },
          {
            model: db.BookingTip,
            as: "BookingTip",
            attributes: ["tipAmount", "createdAt"],
          },
          {
            model: db.Customer,
            as: "Customer",
            include: [{ model: db.User, as: "user", attributes: ["fullName"] }],
          },
        ],
        order: [["bookingDate", "ASC"]],
      });

      return {
        ...salary.get({ plain: true }),
        workHistory: bookings.map((b) => ({
          idBooking:    b.idBooking,
          date:         b.bookingDate,
          customerName: b.Customer?.user?.fullName || "Khách vãng lai",
          services:     b.BookingDetails.map((d) => d.service?.name).join(", "),
          servicePrice: b.BookingDetails.reduce((sum, d) => sum + parseFloat(d.price), 0),
          tipAmount:    b.BookingTip ? parseFloat(b.BookingTip.tipAmount) : 0,
        })),
      };
    })
  );

  return detailedSalaries;
};

export const confirmPayslipByBarber = async (idSalary, idBarber) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber" }],
  });

  if (!salary)                                          throw new Error("Không tìm thấy phiếu");
  if (parseInt(salary.idBarber) !== parseInt(idBarber)) throw new Error("Không có quyền");
  if (salary.status !== "Pending")                      throw new Error("Chỉ confirm phiếu Pending");

  await salary.update({ status: "Confirmed" });

  await createNotification({
    type:       "SALARY",
    title:      "Thợ đã xác nhận",
    content:    `Thợ đã xác nhận lương tháng ${salary.month}/${salary.year}`,
    targetRole: "admin",
  });

  return salary;
};

export const disputePayslipByBarber = async (idSalary, idBarber, reason) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber" }],
  });

  if (!salary)                                          throw new Error("Không tìm thấy phiếu");
  if (parseInt(salary.idBarber) !== parseInt(idBarber)) throw new Error("Không có quyền");
  if (salary.status !== "Pending")                      throw new Error("Chỉ dispute phiếu Pending");

  await salary.update({
    status:        "Disputed",
    disputeReason: reason,
    disputeCount:  (salary.disputeCount || 0) + 1,
  });

  await createNotification({
    type:       "SALARY",
    title:      "Khiếu nại mới",
    content:    `Tháng ${salary.month}: ${reason}`,
    targetRole: "admin",
  });

  return salary;
};
// services/salaryService.js — REFACTORED

import db from "../models/index.js";
import { fn, col, Op } from "sequelize";
import { createNotification } from "./notificationService.js";

// ═══════════════════════════════════════════════════════════════════════════
// 1. Tính lương REALTIME (không lưu DB) — Dùng để preview
// ═══════════════════════════════════════════════════════════════════════════
export const calculateRealtimeSalaries = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const salaries = await db.Barber.findAll({
    include: [
      { model: db.User, as: "user", attributes: ["idUser", "fullName"], required: true },
      { model: db.Branch, as: "branch", attributes: ["name"], required: false },
      {
        model: db.Booking,
        as: "Bookings",
        required: false,
        where: { isPaid: true, bookingDate: { [Op.gte]: startDate, [Op.lt]: endDate } },
        include: [
          { model: db.BookingDetail, as: "BookingDetails", attributes: [] },
          { model: db.BookingTip, as: "BookingTip", attributes: [] },
        ],
        attributes: [],
      },
    ],
    attributes: [
      "idBarber",
      [fn("COALESCE", fn("SUM", col("Bookings.BookingDetails.price")), 0), "serviceRevenue"],
      [fn("COALESCE", fn("SUM", col("Bookings.BookingTip.tipAmount")), 0), "tipAmount"],
      [col("user.fullName"), "barberName"],
      [col("user.idUser"), "idUser"],
      [col("branch.name"), "branchName"],
    ],
    group: ["Barber.idBarber", "user.idUser", "branch.idBranch"],
  });

  const bonusRules = await db.BonusRule.findAll({ where: { active: true }, order: [["minRevenue", "ASC"]] });

  return salaries.map((b) => {
    const serviceRevenue = parseFloat(b.get("serviceRevenue") || 0);
    const tipAmount = parseFloat(b.get("tipAmount") || 0);
    const baseSalary = 3000000;
    const commission = serviceRevenue * 0.15;

    const rule = bonusRules.find(
      (r) => serviceRevenue >= parseFloat(r.minRevenue) && (r.maxRevenue == null || serviceRevenue <= parseFloat(r.maxRevenue))
    );
    const bonus = rule ? (commission * parseFloat(rule.bonusPercent)) / 100 : 0;
    const totalSalary = baseSalary + commission + tipAmount + bonus;

    return {
      // ── Core data ──
      idBarber: b.idBarber,
      idUser: b.get("idUser"),
      barberName: b.get("barberName"),
      branchName: b.get("branchName") || "",
      month,
      year,
      
      // ── Salary breakdown ──
      serviceRevenue,
      baseSalary,
      commission,
      tip: tipAmount,
      bonus,
      
      // ── Defaults cho realtime (chưa lưu DB) ──
      idSalary: null,
      advance: 0,
      deduction: 0,
      adjustmentNote: null,
      status: "Realtime", // 🆕 Trạng thái đặc biệt: chỉ xem, không action
      disputeCount: 0,
      disputeReason: null,
      deadlineAt: null,
      paidAmount: 0,
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
          { model: db.User, as: "user", attributes: ["idUser", "fullName"] },
          { model: db.Branch, as: "branch", attributes: ["name"] },
        ],
      },
      { model: db.SalaryDeduction, as: "DeductionsList", required: false },
    ],
    order: [["idBarber", "ASC"]],
  });

  return savedSalaries.map((s) => {
    const advance = s.DeductionsList?.filter((d) => d.type === "Tạm ứng").reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
    const deduction = s.DeductionsList?.filter((d) => d.type !== "Tạm ứng").reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;

    return {
      // ── From Salary table ──
      idSalary: s.idSalary,
      idBarber: s.idBarber,
      idUser: s.barber?.user?.idUser,
      barberName: s.barber?.user?.fullName || "N/A",
      branchName: s.barber?.branch?.name || "",
      month: s.month,
      year: s.year,
      
      // ── Salary breakdown ──
      serviceRevenue: 0, // Không lưu trong Salary table, có thể tính lại nếu cần
      baseSalary: parseFloat(s.baseSalary),
      commission: parseFloat(s.commission),
      tip: parseFloat(s.tips),
      bonus: parseFloat(s.bonus),
      
      // ── Deductions ──
      advance,
      deduction,
      adjustmentNote: s.adjustmentNote,
      
      // ── Status & workflow ──
      status: s.status,
      disputeCount: s.disputeCount || 0,
      disputeReason: s.disputeReason,
      deadlineAt: s.deadlineAt,
      paidAmount: s.paidAmount || 0,
    };
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. API CHO FRONTEND — Logic tổng hợp
// ═══════════════════════════════════════════════════════════════════════════
export const getSalariesForDisplay = async (month, year) => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  const isCurrentMonth = month === currentMonth && year === currentYear;

  // ── Step 1: Thử lấy từ DB trước ──
  const savedData = await getSavedSalaries(month, year);

  // ── Case 1: Có data trong DB → Dùng luôn (ưu tiên) ──
  if (savedData.length > 0) {
    console.log(`✅ Lấy từ DB: Tháng ${month}/${year} — ${savedData.length} bản ghi`);
    return {
      source: "database",
      isCurrentMonth,
      canCalculate: false, // Đã có trong DB rồi, không cần tính lại
      salaries: savedData,
    };
  }

  // ── Case 2: DB trống → Tính realtime ──
  const realtimeData = await calculateRealtimeSalaries(month, year);
  
  console.log(`📊 Tính realtime: Tháng ${month}/${year} — ${realtimeData.length} bản ghi`);

  // ── Case 2a: Tháng hiện tại → Read-only, không tính được ──
  if (isCurrentMonth) {
    return {
      source: "realtime",
      isCurrentMonth: true,
      canCalculate: false,
      message: "Dữ liệu realtime — Chưa hết tháng, chỉ xem được",
      salaries: realtimeData,
    };
  }

  // ── Case 2b: Tháng trước chưa tính → Preview + có nút "Tính nháp" ──
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
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  if (year > currentYear || (year === currentYear && month >= currentMonth)) {
    throw new Error("Không thể tính lương cho tháng hiện tại hoặc tương lai!");
  }

  // Kiểm tra xem tháng này đã có data trong DB chưa
  const existing = await db.Salary.findAll({ where: { month, year } });
  if (existing.length > 0) {
    throw new Error("Tháng này đã tính lương rồi! Không thể tính lại.");
  }

  const realtimeData = await calculateRealtimeSalaries(month, year);
  const transaction = await db.sequelize.transaction();

  try {
    const salariesToCreate = realtimeData.map((s) => ({
      idBarber: s.idBarber,
      month,
      year,
      baseSalary: s.baseSalary,
      commission: s.commission,
      tips: s.tip,
      bonus: s.bonus,
      totalSalary: s.baseSalary + s.commission + s.tip + s.bonus,
      deductions: 0,
      netSalary: s.baseSalary + s.commission + s.tip + s.bonus,
      status: "Draft", // 🔥 Quan trọng: Tạo với status Draft
      disputeCount: 0,
    }));

    await db.Salary.bulkCreate(salariesToCreate, { transaction });
    await transaction.commit();

    console.log(`✅ Đã tạo ${salariesToCreate.length} phiếu lương Draft cho tháng ${month}/${year}`);

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
  if (salary.status !== "Draft" && salary.status !== "Disputed") {
    throw new Error(`Chỉ có thể gửi phiếu ở trạng thái Draft/Disputed, hiện tại: ${salary.status}`);
  }

  const now = new Date();
  const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  await salary.update({ status: "Pending", sentAt: now, deadlineAt: deadline });

  if (salary.barber?.user?.idUser) {
    await createNotification({
      type: "SALARY",
      title: `Phiếu lương tháng ${salary.month}/${salary.year}`,
      content: `Quản lý đã gửi phiếu lương. Vui lòng xác nhận trong 48h tới.`,
      targetRole: "barber",
      targetId: salary.barber.user.idUser,
      referenceId: salary.idSalary,
    });
  }

  return salary;
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. Điều chỉnh Khấu trừ
// ═══════════════════════════════════════════════════════════════════════════
export const adjustSalary = async ({ idSalary, advance, deduction, adjustmentNote }) => {
  const transaction = await db.sequelize.transaction();

  try {
    const salary = await db.Salary.findByPk(idSalary, { transaction });
    if (!salary) throw new Error("Phiếu lương không tồn tại");

    // Xóa deductions cũ
    await db.SalaryDeduction.destroy({ where: { idSalary }, transaction });

    let totalDeduct = 0;
    const deductionsToCreate = [];

    if (advance > 0) {
      deductionsToCreate.push({ idSalary, amount: advance, reason: "Tạm ứng", type: "Tạm ứng" });
      totalDeduct += advance;
    }
    if (deduction > 0) {
      deductionsToCreate.push({ idSalary, amount: deduction, reason: "Phạt", type: "Phạt" });
      totalDeduct += deduction;
    }

    if (deductionsToCreate.length > 0) {
      await db.SalaryDeduction.bulkCreate(deductionsToCreate, { transaction });
    }

    const net = parseFloat(salary.totalSalary) - totalDeduct;

    await salary.update(
      {
        deductions: totalDeduct,
        netSalary: net,
        adjustmentNote,
        // Nếu đang ở Disputed → về Draft để gửi lại
        status: salary.status === "Disputed" ? "Draft" : salary.status,
      },
      { transaction }
    );

    await transaction.commit();
    return salary;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. Force-close Khiếu nại
// ═══════════════════════════════════════════════════════════════════════════
export const forceCloseSalaryDispute = async (idSalary, reason) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber", include: [{ model: db.User, as: "user" }] }],
  });

  if (!salary || salary.status !== "Disputed") {
    throw new Error("Chỉ có thể force-close phiếu đang Disputed");
  }

  await salary.update({
    status: "Confirmed",
    adjustmentNote: `[Admin từ chối khiếu nại]: ${reason}`,
  });

  if (salary.barber?.user?.idUser) {
    await createNotification({
      type: "SALARY",
      title: "Khiếu nại đã bị đóng",
      content: `Quản lý: ${reason}`,
      targetRole: "barber",
      targetId: salary.barber.user.idUser,
      referenceId: salary.idSalary,
    });
  }

  return salary;
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. Thanh toán & Khóa sổ
// ═══════════════════════════════════════════════════════════════════════════
export const markAsPaid = async (idSalary, { paidAmount, paymentProofUrl }) => {
  const salary = await db.Salary.findByPk(idSalary);

  if (!["Confirmed", "AutoConfirmed"].includes(salary.status)) {
    throw new Error("Chỉ được thanh toán phiếu đã Confirmed");
  }

  await salary.update({
    paidAmount,
    paymentProofUrl,
    status: "Paid",
  });

  return salary;
};

// ═══════════════════════════════════════════════════════════════════════════
// BARBER APIs
// ═══════════════════════════════════════════════════════════════════════════
export const getMyPayslips = async (idBarber) => {
  return await db.Salary.findAll({
    where: {
      idBarber,
      status: { [Op.ne]: "Draft" },
    },
    include: [{ model: db.SalaryDeduction, as: "DeductionsList", required: false }],
    order: [["year", "DESC"], ["month", "DESC"]],
  });
};

export const confirmPayslipByBarber = async (idSalary, idBarber) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber" }],
  });

  if (!salary) throw new Error("Không tìm thấy phiếu");
  if (parseInt(salary.idBarber) !== parseInt(idBarber)) throw new Error("Không có quyền");
  if (salary.status !== "Pending") throw new Error("Chỉ confirm phiếu Pending");

  await salary.update({ status: "Confirmed" });

  await createNotification({
    type: "SALARY",
    title: "Thợ đã xác nhận",
    content: `Thợ đã xác nhận lương tháng ${salary.month}/${salary.year}`,
    targetRole: "admin",
  });

  return salary;
};

export const disputePayslipByBarber = async (idSalary, idBarber, reason) => {
  const salary = await db.Salary.findByPk(idSalary, {
    include: [{ model: db.Barber, as: "barber" }],
  });

  if (!salary) throw new Error("Không tìm thấy phiếu");
  if (parseInt(salary.idBarber) !== parseInt(idBarber)) throw new Error("Không có quyền");
  if (salary.status !== "Pending") throw new Error("Chỉ dispute phiếu Pending");

  await salary.update({
    status: "Disputed",
    disputeReason: reason,
    disputeCount: (salary.disputeCount || 0) + 1,
  });

  await createNotification({
    type: "SALARY",
    title: "Khiếu nại mới",
    content: `Tháng ${salary.month}: ${reason}`,
    targetRole: "admin",
  });

  return salary;
};
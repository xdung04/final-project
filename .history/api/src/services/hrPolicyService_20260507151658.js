"use strict";
import db from "../models/index.js";
import moment from "moment";
import { fn, col, Op } from "sequelize";
import {
  notifyCommissionRulesChanged,
  notifyBonusRulesChanged,
  notifyContractAssigned,
  notifyContractUpdated,
  notifyEndDateSet,
  notifyCancelEndDate,
  notifyPromoted,
} from "./notificationService.js";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Kiểm tra Plan co bi lock boi Salary DB khong
// ═══════════════════════════════════════════════════════════════════════════
const assertPlanRulesEditable = async (idCompensationPlan, transaction = null) => {
  const contractsUsingPlan = await db.SalaryContract.findAll({
    where: { idCompensationPlan },
    attributes: ["idBarber"],
    raw: true,
    transaction,
  });

  if (contractsUsingPlan.length === 0) return;

  const barberIds = [...new Set(contractsUsingPlan.map((c) => c.idBarber))];

  const existingSalary = await db.Salary.findOne({
    where: { idBarber: { [Op.in]: barberIds } },
    transaction,
  });

  if (existingSalary) {
    throw new Error(
      `Khong the sua quy tac: Plan nay da duoc dung de tinh luong thang ` +
      `${existingSalary.month}/${existingSalary.year}. ` +
      `Vui long tao Plan moi thay vi sua Plan hien tai.`
    );
  }
};
export const getContractById = async (idContract) => {
  return db.SalaryContract.findByPk(idContract);
};
// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Validate startDate phai la ngay mung 1
// ═══════════════════════════════════════════════════════════════════════════
const assertFirstDayOfMonth = (dateStr) => {
  if (moment(dateStr).date() !== 1) {
    throw new Error(`startDate phai la ngay 01 hang thang. Nhan duoc: ${dateStr}`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPENSATION PLAN
// ═══════════════════════════════════════════════════════════════════════════

export const getAllActivePlans = async () => {
  return db.CompensationPlan.findAll({
    where: { effectiveTo: null },
    order: [["levelOrder", "ASC"]],
    include: [{
      model: db.CompensationPlan,
      as: "nextPlan",
      attributes: ["idCompensationPlan", "displayName"],
    }],
  });
};

export const savePlan = async (planData) => {
  if (planData.idCompensationPlan) {
    await db.CompensationPlan.update(planData, {
      where: { idCompensationPlan: planData.idCompensationPlan },
    });
    return db.CompensationPlan.findByPk(planData.idCompensationPlan);
  }
  planData.effectiveFrom = new Date();
  return db.CompensationPlan.create(planData);
};

export const deletePlan = async (idCompensationPlan) => {
  const activeContract = await db.SalaryContract.findOne({
    where: { idCompensationPlan, status: "active" },
  });
  if (activeContract) {
    throw new Error("Khong the xoa Plan: Dang co tho su dung Plan nay.");
  }
  await db.CompensationPlan.update(
    { effectiveTo: new Date() },
    { where: { idCompensationPlan } }
  );
};

export const getRulesByPlan = async (idCompensationPlan) => {
  const commissionRules = await db.CommissionRule.findAll({
    where: { idCompensationPlan },
    order: [["minRevenueStep", "ASC"]],
  });
  const bonusRules = await db.BonusRule.findAll({
    where: { idCompensationPlan },
  });
  return { commissionRules, bonusRules };
};

// ═══════════════════════════════════════════════════════════════════════════
// COMMISSION RULES
// ═══════════════════════════════════════════════════════════════════════════
export const saveCommissionRules = async (idCompensationPlan, rulesArray) => {
  const t = await db.sequelize.transaction();
  try {
    await assertPlanRulesEditable(idCompensationPlan, t);
    await db.CommissionRule.destroy({ where: { idCompensationPlan }, transaction: t });
    await db.CommissionRule.bulkCreate(
      rulesArray.map((rule) => ({ ...rule, idCompensationPlan })),
      { transaction: t }
    );
    const plan = await db.CompensationPlan.findByPk(idCompensationPlan, { transaction: t });
    await notifyCommissionRulesChanged(idCompensationPlan, plan?.displayName || "", t);
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BONUS RULES
// ═══════════════════════════════════════════════════════════════════════════
export const saveBonusRules = async (idCompensationPlan, rulesArray) => {
  const t = await db.sequelize.transaction();
  try {
    await assertPlanRulesEditable(idCompensationPlan, t);
    await db.BonusRule.destroy({ where: { idCompensationPlan }, transaction: t });
    await db.BonusRule.bulkCreate(
      rulesArray.map((rule) => ({ ...rule, idCompensationPlan })),
      { transaction: t }
    );
    const plan = await db.CompensationPlan.findByPk(idCompensationPlan, { transaction: t });
    await notifyBonusRulesChanged(idCompensationPlan, plan?.displayName || "", t);
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLONE PLAN
// ═══════════════════════════════════════════════════════════════════════════
export const clonePlan = async (idCompensationPlan) => {
  const t = await db.sequelize.transaction();
  try {
    const original = await db.CompensationPlan.findByPk(idCompensationPlan, {
      include: [
        { model: db.CommissionRule, as: "commissionRules" },
        { model: db.BonusRule,      as: "bonusRules" },
      ],
      transaction: t,
    });
    if (!original) throw new Error("Khong tim thay Plan goc.");

    const newPlan = await db.CompensationPlan.create({
      roleType:               original.roleType,
      displayName:            `${original.displayName} (v2)`,
      levelOrder:             original.levelOrder,
      defaultBaseSalary:      original.defaultBaseSalary,
      idNextPlan:             original.idNextPlan,
      minRevenueToPromote:    original.minRevenueToPromote,
      evaluationPeriodMonths: original.evaluationPeriodMonths,
      minMonthsInLevel:       original.minMonthsInLevel,
      effectiveFrom:          new Date(),
      effectiveTo:            null,
    }, { transaction: t });

    if (original.commissionRules?.length > 0) {
      await db.CommissionRule.bulkCreate(
        original.commissionRules.map(({ idCompensationPlan: _, idCommissionRule: __, ...rest }) => ({
          ...rest, idCompensationPlan: newPlan.idCompensationPlan,
        })),
        { transaction: t }
      );
    }
    if (original.bonusRules?.length > 0) {
      await db.BonusRule.bulkCreate(
        original.bonusRules.map(({ idCompensationPlan: _, idBonusRule: __, ...rest }) => ({
          ...rest, idCompensationPlan: newPlan.idCompensationPlan,
        })),
        { transaction: t }
      );
    }
    await t.commit();
    return newPlan;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HOP DONG (SalaryContract)
// ═══════════════════════════════════════════════════════════════════════════

export const getBarbersWithContracts = async () => {
  return db.Barber.findAll({
    where: { isLocked: false },
    include: [
      { model: db.User,   as: "user",   attributes: ["fullName", "phoneNumber", "email"] },
      { model: db.Branch, as: "branch", attributes: ["name"], required: false },
      {
        model: db.SalaryContract,
        as: "contracts",
        where: { status: "active" },
        required: false,
        include: [{
          model: db.CompensationPlan,
          as: "plan",
          attributes: ["idCompensationPlan", "displayName", "defaultBaseSalary"],
        }],
      },
    ],
  });
};

// ── KY HD MOI (tho moi, chua co HD nao) ──────────────────────────────────
// startDate bat buoc = mung 1 thang sau
// endDate luon null
export const assignContract = async (idBarber, contractData) => {
  // Guard 1: startDate phai la mung 1
  assertFirstDayOfMonth(contractData.startDate);

  // Guard 2: startDate phai >= mung 1 thang sau
  const firstDayNextMonth = moment().add(1, "months").startOf("month").format("YYYY-MM-DD");
  if (contractData.startDate < firstDayNextMonth) {
    throw new Error(`startDate phai tu mung 1 thang sau. Som nhat: ${firstDayNextMonth}`);
  }

  // Guard 3: Barber chua co HD active
  const existing = await db.SalaryContract.findOne({
    where: { idBarber, status: "active" },
  });
  if (existing) {
    throw new Error(
      "Barber nay da co hop dong active. Dung 'Len cap' hoac 'Quyet toan' thay vi ky moi."
    );
  }

  const newContract = await db.SalaryContract.create({
    idBarber,
    idCompensationPlan: contractData.idCompensationPlan,
    actualBaseSalary:   contractData.actualBaseSalary,
    startDate:          contractData.startDate,
    endDate:            null,
    status:             "active",
  });

  const plan = await db.CompensationPlan.findByPk(contractData.idCompensationPlan);
  await notifyContractAssigned({
    idBarber,
    planName:  plan?.displayName || "",
    startDate: newContract.startDate,
    endDate:   null,
  });

  return newContract;
};

// ── SUA HD CHO HIEU LUC ───────────────────────────────────────────────────
// Chi cho sua Plan + Luong thuc te
// startDate KHONG duoc sua
export const updatePendingContract = async (idContract, updateData) => {
  const contract = await db.SalaryContract.findByPk(idContract);
  if (!contract) throw new Error("Khong tim thay hop dong.");

  if (moment().format("YYYY-MM-DD") >= contract.startDate) {
    throw new Error("Hop dong da co hieu luc, khong duoc chinh sua.");
  }

  // ✅ Lấy idPlan mới trước khi update
  const newPlanId = updateData.idCompensationPlan || contract.idCompensationPlan;

  await contract.update({
    idCompensationPlan: newPlanId,
    actualBaseSalary:   updateData.actualBaseSalary || contract.actualBaseSalary,
  });

  // ✅ Dùng newPlanId thay vì contract.idCompensationPlan
  const plan = await db.CompensationPlan.findByPk(newPlanId);
  await notifyContractUpdated({
    idBarber:  contract.idBarber,
    planName:  plan?.displayName || "",
    startDate: contract.startDate,
  });

  return contract;
};

// ── PREVIEW NGAY NGHI: Lay danh sach booking bi anh huong ────────────────
// Chi preview, CHUA thuc su set endDate
export const previewEndDate = async (idContract, endDate) => {
  const contract = await db.SalaryContract.findByPk(idContract);
  if (!contract) throw new Error("Khong tim thay hop dong.");
  if (contract.status !== "active") throw new Error("Chi thiet lap ngay nghi cho HD dang active.");

 const affectedBookings = await db.Booking.findAll({
  where: {
    idBarber:    contract.idBarber,
    bookingDate: { [Op.gt]: endDate },
    status:      { [Op.notIn]: ["Cancelled", "Completed"] }, // ✅ viết hoa theo ENUM
  },
include: [{
  model: db.Customer,
  as:    "Customer",
  include: [{
    model:      db.User,
    as:         "user",       // cần confirm alias trong Customer.associate
    attributes: ["fullName", "phoneNumber"],
  }],
}],
  order: [["bookingDate", "ASC"]],
});

  return {
    endDate,
    affectedCount:    affectedBookings.length,
    affectedBookings,
  };
};

// ── XAC NHAN SET NGAY NGHI + HUY BOOKING ─────────────────────────────────
export const confirmSetEndDate = async (idContract, endDate) => {
  const t = await db.sequelize.transaction();
  try {
    const contract = await db.SalaryContract.findByPk(idContract, { transaction: t });
    if (!contract) throw new Error("Khong tim thay hop dong.");
    if (contract.status !== "active") throw new Error("Chi thiet lap ngay nghi cho HD dang active.");

    // ✅ endDate phai sau startDate
    if (endDate <= contract.startDate) {
      throw new Error("endDate phai sau ngay bat dau hop dong.");
    }

    // ✅ Canh bao neu da co endDate roi (tranh ghi de nham)
    if (contract.endDate) {
      throw new Error(
        `HD nay da co ngay ket thuc: ${contract.endDate}. Hay huy ngay nghi truoc khi thiet lap lai.`
      );
    }

    await contract.update({ endDate }, { transaction: t });

    const affectedBookings = await db.Booking.findAll({
      where: {
        idBarber:    contract.idBarber,
        bookingDate: { [Op.gt]: endDate },
status: { [Op.notIn]: ["Cancelled", "Completed"] },
      },
      transaction: t,
    });

    if (affectedBookings.length > 0) {
      await db.Booking.update(
        { status: "cancelled" },
        {
          where: { idBooking: { [Op.in]: affectedBookings.map((b) => b.idBooking) } },
          transaction: t,
        }
      );
    }

    await t.commit();

    await notifyEndDateSet({ idBarber: contract.idBarber, endDate });

    return { contract, cancelledCount: affectedBookings.length };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ── HUY NGAY NGHI ─────────────────────────────────────────────────────────
// Set endDate = null
// Booking da huy KHONG tu dong khoi phuc
export const cancelEndDate = async (idContract) => {
  const contract = await db.SalaryContract.findByPk(idContract);
  if (!contract) throw new Error("Khong tim thay hop dong.");
  if (!contract.endDate) throw new Error("HD nay chua co ngay ket thuc de huy.");

  await contract.update({ endDate: null });
  await notifyCancelEndDate({ idBarber: contract.idBarber });

  return contract;
};

export const promoteBarber = async (idBarber, contractData, salaryPeriod) => {
  // salaryPeriod = { month, year } của kỳ lương vừa confirm
  // VD: Admin confirm lương tháng 5/2025 → salaryPeriod = { month: 5, year: 2025 }

  const t = await db.sequelize.transaction();
  try {
    // ✅ Validate plan mới tồn tại và còn hiệu lực TRƯỚC khi động vào HĐ cũ
    const newPlan = await db.CompensationPlan.findByPk(
      contractData.idCompensationPlan,
      { transaction: t }
    );
    if (!newPlan)                  throw new Error("Plan mới không tồn tại.");
    if (newPlan.effectiveTo !== null) throw new Error("Plan mới đã hết hiệu lực.");

    // ✅ Tính đúng theo kỳ lương — không dùng tháng hiện tại
    const lastDayOfSalaryMonth = moment(`${salaryPeriod.year}-${salaryPeriod.month}`, "YYYY-M")
      .endOf("month")
      .format("YYYY-MM-DD");
    // VD: 31/5/2025

    const firstDayOfNextMonth = moment(`${salaryPeriod.year}-${salaryPeriod.month}`, "YYYY-M")
      .add(1, "months")
      .startOf("month")
      .format("YYYY-MM-DD");
    // VD: 1/6/2025

    // Lấy HĐ active
    const activeContract = await db.SalaryContract.findOne({
      where: { idBarber, status: "active" },
      transaction: t,
    });
    if (!activeContract) throw new Error("Không tìm thấy HĐ active để lên cấp.");

    // ✅ Không lên cấp nếu đang trong lộ trình nghỉ việc
    if (activeContract.endDate) {
      throw new Error("Barber đã được thiết lập ngày nghỉ việc, không thể lên cấp.");
    }

    // Đóng HĐ cũ — endDate = ngày cuối tháng kỳ lương
    await activeContract.update(
      {
        status:  "closed",
        endDate: lastDayOfSalaryMonth, // 31/5/2025
      },
      { transaction: t }
    );

    // Tạo HĐ mới — startDate = mùng 1 tháng sau kỳ lương
    const newContract = await db.SalaryContract.create(
      {
        idBarber,
        idCompensationPlan: contractData.idCompensationPlan,
        actualBaseSalary:   contractData.actualBaseSalary, // Admin có thể override
        startDate:          firstDayOfNextMonth, // 1/6/2025
        endDate:            null,
        status:             "active",
      },
      { transaction: t }
    );

    await t.commit();

    // Notify barber sau khi commit thành công
    await notifyPromoted({
      idBarber,
      planName:  newPlan.displayName,
      startDate: firstDayOfNextMonth,
    });

    return newContract;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
// salaryService.js — THÊM HÀM NÀY

export const calculateSettlement = async (idContract, deductions = []) => {
  const t = await db.sequelize.transaction();
  try {
    // ── BƯỚC 1: Lấy HĐ + Plan + Barber ──────────────────────────────────
    const contract = await db.SalaryContract.findByPk(idContract, {
      include: [
        {
          model: db.CompensationPlan,
          as: "plan",
          include: [
            { model: db.CommissionRule, as: "commissionRules" },
            { model: db.BonusRule,      as: "bonusRules" },
          ],
        },
      ],
      transaction: t,
    });

    if (!contract) throw new Error("Không tìm thấy hợp đồng.");
    if (contract.status !== "active") throw new Error("Hợp đồng không còn active.");
    if (!contract.endDate) throw new Error("Hợp đồng chưa có endDate, vui lòng thiết lập ngày nghỉ trước.");

    const { idBarber, actualBaseSalary, endDate, plan } = contract;

    // ── BƯỚC 2: Xác định khoảng thời gian tính lương ─────────────────────
    const endMoment      = moment(endDate);
    const month          = endMoment.month() + 1;         // tháng của endDate
    const year           = endMoment.year();
    const firstDayOfMonth = moment(`${year}-${month}`, "YYYY-M").startOf("month");
    const daysInMonth    = endMoment.daysInMonth();
    const daysWorked     = endMoment.diff(firstDayOfMonth, "days") + 1; // tính cả ngày cuối

    // ── BƯỚC 3: Kiểm tra chưa có Salary SETTLEMENT tháng này ─────────────
    const existingSettlement = await db.Salary.findOne({
      where: { idBarber, month, year, calculationType: "SETTLEMENT" },
      transaction: t,
    });
    if (existingSettlement) {
      throw new Error(`Barber này đã có phiếu quyết toán tháng ${month}/${year} rồi.`);
    }

    // ── BƯỚC 4: Lấy doanh thu, tips, số khách từ ngày 1 → endDate ────────
    const startDate = firstDayOfMonth.toDate();
    const endDateObj = endMoment.toDate();

    const revenueData = await db.Barber.findOne({
      where: { idBarber },
      attributes: [
        [fn("COALESCE", fn("SUM", col("Bookings.BookingDetails.price")), 0), "serviceRevenue"],
        [fn("COALESCE", fn("SUM", col("Bookings.BookingTip.tipAmount")),   0), "tipAmount"],
        [fn("COUNT",    fn("DISTINCT", col("Bookings.idBooking"))),            "customerCount"],
      ],
      include: [{
        model: db.Booking,
        as: "Bookings",
        required: false,
        where: {
          isPaid:      true,
          bookingDate: { [Op.gte]: startDate, [Op.lte]: endDateObj },
        },
        attributes: [],
        include: [
          { model: db.BookingDetail, as: "BookingDetails", attributes: [] },
          { model: db.BookingTip,    as: "BookingTip",     attributes: [] },
        ],
      }],
      raw: true,
      transaction: t,
    });

    const serviceRevenue = parseFloat(revenueData?.serviceRevenue || 0);
    const tipAmount      = parseFloat(revenueData?.tipAmount      || 0);
    const customerCount  = parseInt(revenueData?.customerCount    || 0);

    // ── BƯỚC 5: Lấy rating trung bình ────────────────────────────────────
    const ratingSummary = await db.BarberRatingSummary.findOne({
      where: { idBarber },
      transaction: t,
    });
    const averageRating = parseFloat(ratingSummary?.avgRate || 0);

    // ── BƯỚC 6: Tính lương ────────────────────────────────────────────────
    // Lương cứng theo tỷ lệ ngày
    const baseSalary = (parseFloat(actualBaseSalary) / daysInMonth) * daysWorked;

    // Hoa hồng bậc thang — 100% doanh thu từ ngày 1 → endDate
    let commission = 0;
    if (plan?.commissionRules?.length > 0) {
      const matched = plan.commissionRules.find(
        (r) =>
          serviceRevenue >= parseFloat(r.minRevenueStep) &&
          (r.maxRevenueStep == null || serviceRevenue <= parseFloat(r.maxRevenueStep))
      );
      if (matched) commission = serviceRevenue * (parseFloat(matched.commissionRate) / 100);
    }

    // Thưởng KPI — vẫn tính nếu đạt
    let bonus = 0;
    if (plan?.bonusRules?.length > 0) {
      plan.bonusRules.forEach((rule) => {
        if (
          customerCount >= rule.minCustomerCount &&
          averageRating >= parseFloat(rule.minAverageRating)
        ) {
          bonus += parseFloat(rule.rewardAmount);
        }
      });
    }

    const totalSalary = baseSalary + commission + tipAmount + bonus;

    // ── BƯỚC 7: Tạo Salary SETTLEMENT ────────────────────────────────────
    const salary = await db.Salary.create(
      {
        idBarber,
        idContract,
        month,
        year,
        calculationType: "SETTLEMENT",
        daysWorked,
        serviceRevenue,
        baseSalary:      Math.round(baseSalary),
        commission:      Math.round(commission),
        tips:            tipAmount,
        bonus:           Math.round(bonus),
        totalSalary:     Math.round(totalSalary),
        deductions:      0,
        netSalary:       Math.round(totalSalary),
        status:          "Paid", // Quyết toán → Paid ngay
        disputeCount:    0,
      },
      { transaction: t }
    );

    // ── BƯỚC 8: Tạo SalaryDeduction records ──────────────────────────────
    if (deductions.length > 0) {
      await db.SalaryDeduction.bulkCreate(
        deductions.map((d) => ({
          idSalary:      salary.idSalary,
          amount:        Number(d.amount),
          reason:        d.reason?.trim(),
          violationDate: d.violationDate || null,
        })),
        { transaction: t }
      );

      // Tính lại deductions + netSalary sau khi tạo xong
      const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);
      const netSalary       = Math.round(totalSalary) - totalDeductions;

      await salary.update(
        { deductions: totalDeductions, netSalary },
        { transaction: t }
      );
    }

    // ── BƯỚC 9: Đóng HĐ + Khóa Barber ────────────────────────────────────
    await contract.update(
      { status: "terminated" },
      { transaction: t }
    );

    await db.Barber.update(
      { isLocked: true },
      { where: { idBarber }, transaction: t }
    );

    await t.commit();

    // ── BƯỚC 10: Notify barber (sau commit) ───────────────────────────────
    const { notifySettlementDone } = await import("./notificationService.js");
    await notifySettlementDone({
      idBarber,
      netSalary: salary.netSalary,
      idSalary:  salary.idSalary,
    });

    return {
      salary,
      summary: {
        month,
        year,
        daysWorked,
        daysInMonth,
        baseSalary:   Math.round(baseSalary),
        commission:   Math.round(commission),
        tips:         tipAmount,
        bonus:        Math.round(bonus),
        totalSalary:  Math.round(totalSalary),
        deductions:   salary.deductions,
        netSalary:    salary.netSalary,
      },
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
export const checkPromotionEligibility = async (idBarber) => {
  // ── BƯỚC 1: Lấy HĐ active + plan hiện tại ──────────────────────────────
  const activeContract = await db.SalaryContract.findOne({
    where: { idBarber, status: "active" },
    include: [{
      model: db.CompensationPlan,
      as: "plan",
      include: [{
        model: db.CompensationPlan,
        as: "nextPlan",
        attributes: ["idCompensationPlan", "displayName", "defaultBaseSalary"],
      }],
    }],
  });

  // Không có HĐ active → bỏ qua
  if (!activeContract) return;

  const plan = activeContract.plan;

  // Không có cấp tiếp theo (Master) hoặc nextPlan đã bị xóa → bỏ qua
  if (!plan?.idNextPlan || !plan?.nextPlan?.idCompensationPlan) return;

  // Đang trong lộ trình nghỉ → không lên cấp
  if (activeContract.endDate) return;

  // ── BƯỚC 2: Kiểm tra số tháng đã ở cấp hiện tại ────────────────────────
  const monthsInLevel = moment().diff(moment(activeContract.startDate), "months");

  if (monthsInLevel < (plan.minMonthsInLevel || 0)) return;

  // ── BƯỚC 3: Kiểm tra doanh thu TB N tháng gần nhất ─────────────────────
  const evalMonths = plan.evaluationPeriodMonths || 1;

  const recentSalaries = await db.Salary.findAll({
    where: {
      idBarber,
      status:          { [Op.in]: ["Confirmed", "AutoConfirmed", "Paid"] },
      calculationType: "MONTHLY", // Chỉ tính lương thường, không tính Settlement
    },
    order:      [["year", "DESC"], ["month", "DESC"]],
    limit:      evalMonths,
    attributes: ["serviceRevenue", "month", "year"],
    raw:        true,
  });

  // Chưa đủ số tháng đánh giá → bỏ qua
  if (recentSalaries.length < evalMonths) return;

  // Tính doanh thu trung bình
  const avgRevenue = recentSalaries.reduce(
    (sum, s) => sum + parseFloat(s.serviceRevenue || 0), 0
  ) / evalMonths;

  if (avgRevenue < parseFloat(plan.minRevenueToPromote || 0)) return;

  // ── BƯỚC 4: Đủ điều kiện → Notify admin ────────────────────────────────
  // idBarber = idUser (quan hệ 1-1)
  const barberInfo = await db.User.findByPk(idBarber, {
    attributes: ["fullName"],
    raw: true,
  });

  const { notifyPromotionEligible } = await import("./notificationService.js");
  await notifyPromotionEligible({
    idBarber,
    barberName:      barberInfo?.fullName || `Barber #${idBarber}`,
    currentPlanName: plan.displayName,
    nextPlanName:    plan.nextPlan.displayName,
    idContract:      activeContract.idSalaryContract, // ✅ đúng field name
  });
};
// BE: hrPolicyService.js
// Thay thế hàm getPromotionAlerts trong hrPolicyService.js

export const getPromotionAlerts = async () => {
  // Lấy tất cả HĐ active, không trong lộ trình nghỉ, có nextPlan
  const activeContracts = await db.SalaryContract.findAll({
    where: {
      status:  "active",
      endDate: null, // Không đang trong lộ trình nghỉ
    },
    include: [
      {
        model: db.CompensationPlan,
        as: "plan",
        where: { idNextPlan: { [Op.ne]: null } }, // Chưa phải Master
        include: [{
          model: db.CompensationPlan,
          as: "nextPlan",
          attributes: ["idCompensationPlan", "displayName", "defaultBaseSalary"],
        }],
      },
      {
        model: db.Barber,
        as: "barber",
        include: [{ model: db.User, as: "user", attributes: ["fullName"] }],
      },
    ],
  });

  const results = await Promise.all(
    activeContracts.map(async (contract) => {
      const plan = contract.plan;

      // ── Check 1: Số tháng ở cấp hiện tại ──────────────────────────────
      const monthsInLevel = moment().diff(moment(contract.startDate), "months");
      if (monthsInLevel < (plan.minMonthsInLevel || 0)) return null;

      // ── Check 2: Doanh thu TB N tháng gần nhất ─────────────────────────
      const evalMonths = plan.evaluationPeriodMonths || 1;

      const recentSalaries = await db.Salary.findAll({
        where: {
          idBarber:        contract.idBarber,
          status:          { [Op.in]: ["Confirmed", "AutoConfirmed", "Paid"] },
          calculationType: "MONTHLY",
        },
        order:      [["year", "DESC"], ["month", "DESC"]],
        limit:      evalMonths,
        attributes: ["serviceRevenue", "month", "year"],
        raw:        true,
      });

      // Chưa đủ số tháng đánh giá
      if (recentSalaries.length < evalMonths) return null;

      const avgRevenue = recentSalaries.reduce(
        (sum, s) => sum + parseFloat(s.serviceRevenue || 0), 0
      ) / evalMonths;

      if (avgRevenue < parseFloat(plan.minRevenueToPromote || 0)) return null;

      // ── Đủ điều kiện → trả về alert data ──────────────────────────────
      const lastSalary = recentSalaries[0]; // Tháng gần nhất

      return {
        idContract:        contract.idSalaryContract,
        idBarber:          contract.idBarber,
        barberName:        contract.barber?.user?.fullName || `Barber #${contract.idBarber}`,
        currentPlanName:   plan.displayName,
        nextPlanName:      plan.nextPlan.displayName,
        idNextPlan:        plan.idNextPlan,
        defaultBaseSalary: plan.nextPlan.defaultBaseSalary || 0,
        salaryPeriod: {
          month: lastSalary.month,
          year:  lastSalary.year,
        },
      };
    })
  );

  return results.filter(Boolean);
};
// BE: hrPolicyService.js
export const cancelPendingContract = async (idContract) => {
  const contract = await db.SalaryContract.findByPk(idContract);
  if (!contract) throw new Error("Không tìm thấy hợp đồng.");

  const today = moment().format("YYYY-MM-DD");
  if (contract.startDate <= today) {
    throw new Error("Hợp đồng đã có hiệu lực, không thể hủy.");
  }

  await contract.destroy(); // Xóa hẳn vì chưa có hiệu lực
};

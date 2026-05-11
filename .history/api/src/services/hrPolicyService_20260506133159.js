"use strict";
import db from "../models/index.js";
import moment from "moment";
import { Op } from "sequelize";
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
      status:      { [Op.notIn]: ["cancelled", "completed"] },
    },
    include: [{
      model:      db.User,
      as:         "customer",
      attributes: ["fullName", "phoneNumber"],
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

    await contract.update({ endDate }, { transaction: t });

    // Lay booking bi anh huong
    const affectedBookings = await db.Booking.findAll({
      where: {
        idBarber:    contract.idBarber,
        bookingDate: { [Op.gt]: endDate },
        status:      { [Op.notIn]: ["cancelled", "completed"] },
      },
      transaction: t,
    });

    // Huy toan bo booking sau endDate
    if (affectedBookings.length > 0) {
      await db.Booking.update(
        { status: "cancelled" },
        {
          where: { idBooking: { [Op.in]: affectedBookings.map((b) => b.idBooking) } },
          transaction: t,
        }
      );
      // TODO: notify khach hang khi BookingNotification service san sang
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

// ── LEN CAP ───────────────────────────────────────────────────────────────
// Dong HD cu (endDate = ngay cuoi thang nay, status = closed)
// Tao HD moi (startDate = mung 1 thang sau, plan moi)
export const promoteBarber = async (idBarber, contractData) => {
  const t = await db.sequelize.transaction();
  try {
    const lastDayThisMonth  = moment().endOf("month").format("YYYY-MM-DD");
    const firstDayNextMonth = moment().add(1, "months").startOf("month").format("YYYY-MM-DD");

    const activeContract = await db.SalaryContract.findOne({
      where: { idBarber, status: "active" },
      transaction: t,
    });
    if (!activeContract) throw new Error("Khong tim thay HD active de len cap.");

    // Dong HD cu
    await activeContract.update(
      { status: "closed", endDate: lastDayThisMonth },
      { transaction: t }
    );

    // Tao HD moi
    const newContract = await db.SalaryContract.create(
      {
        idBarber,
        idCompensationPlan: contractData.idCompensationPlan,
        actualBaseSalary:   contractData.actualBaseSalary,
        startDate:          firstDayNextMonth,
        endDate:            null,
        status:             "active",
      },
      { transaction: t }
    );

    const plan = await db.CompensationPlan.findByPk(contractData.idCompensationPlan, { transaction: t });

    await t.commit();

    await notifyPromoted({
      idBarber,
      planName:  plan?.displayName || "",
      startDate: firstDayNextMonth,
    });

    return newContract;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
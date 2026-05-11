"use strict";
import db from "../models/index.js";
import moment from "moment";
import { Op } from "sequelize";
import {
  notifyCommissionRulesChanged,
  notifyBonusRulesChanged,
  notifyContractAssigned,
  notifyContractUpdated,
  notifyContractTerminated,
} from "./notificationService.js";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER GUARD
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
      `Không thể sửa quy tắc: Plan này đã được dùng để tính lương tháng ` +
      `${existingSalary.month}/${existingSalary.year} và đã lưu vào DB. ` +
      `Vui lòng tạo Plan mới thay vì sửa Plan hiện tại.`
    );
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPENSATION PLAN — CRUD
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
  } else {
    planData.effectiveFrom = new Date();
    return db.CompensationPlan.create(planData);
  }
};

export const deletePlan = async (idCompensationPlan) => {
  const activeContract = await db.SalaryContract.findOne({
    where: { idCompensationPlan, status: "active" },
  });

  if (activeContract) {
    throw new Error(
      "Không thể xóa Plan: Đang có thợ sử dụng Plan này trong hợp đồng active. " +
      "Vui lòng chuyển thợ sang Plan khác trước."
    );
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

    // Lấy tên Plan để ghi vào nội dung thông báo
    const plan = await db.CompensationPlan.findByPk(idCompensationPlan, { transaction: t });

    // ✅ Gửi thông báo cho tất cả barber đang dùng plan này
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

    // ✅ Gửi thông báo cho tất cả barber đang dùng plan này
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

    if (!original) throw new Error("Không tìm thấy Plan gốc.");

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
          ...rest,
          idCompensationPlan: newPlan.idCompensationPlan,
        })),
        { transaction: t }
      );
    }

    if (original.bonusRules?.length > 0) {
      await db.BonusRule.bulkCreate(
        original.bonusRules.map(({ idCompensationPlan: _, idBonusRule: __, ...rest }) => ({
          ...rest,
          idCompensationPlan: newPlan.idCompensationPlan,
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
// HỢP ĐỒNG (SalaryContract)
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

// ── KÝ HỢP ĐỒNG MỚI ─────────────────────────────────────────────────────
export const assignContract = async (idBarber, contractData) => {
  const t = await db.sequelize.transaction();
  try {
    const today = moment().format("YYYY-MM-DD");

    const activeContract = await db.SalaryContract.findOne({
      where: { idBarber, status: "active" },
      transaction: t,
    });

    if (activeContract) {
      await activeContract.update({ status: "closed", endDate: today }, { transaction: t });
    }

    const newContract = await db.SalaryContract.create(
      {
        idBarber,
        idCompensationPlan: contractData.idCompensationPlan,
        actualBaseSalary:   contractData.actualBaseSalary,
        startDate:          contractData.startDate || today,
        endDate:            contractData.endDate   || null,
        status:             "active",
      },
      { transaction: t }
    );

    const plan = await db.CompensationPlan.findByPk(contractData.idCompensationPlan, { transaction: t });

    await t.commit();

    // ✅ Báo cho barber biết hợp đồng mới vừa được ký
    // Chạy SAU commit — nếu notify lỗi chỉ log, không rollback hợp đồng đã ký
    await notifyContractAssigned({
      idBarber,
      planName:  plan?.displayName || "",
      startDate: newContract.startDate,
      endDate:   newContract.endDate,
    });
    return newContract;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ── SỬA HỢP ĐỒNG NHÁP ───────────────────────────────────────────────────
export const updatePendingContract = async (idContract, updateData) => {
  const contract = await db.SalaryContract.findByPk(idContract);
  if (!contract) throw new Error("Không tìm thấy hợp đồng.");

  const today = moment().format("YYYY-MM-DD");

  if (moment(today).isSameOrAfter(contract.startDate)) {
    throw new Error(
      "Hợp đồng này đã có hiệu lực, không được chỉnh sửa. " +
      "Vui lòng chấm dứt hợp đồng hiện tại và ký hợp đồng mới."
    );
  }

  await contract.update({
    idCompensationPlan: updateData.idCompensationPlan || contract.idCompensationPlan,
    actualBaseSalary:   updateData.actualBaseSalary   || contract.actualBaseSalary,
    startDate:          updateData.startDate          || contract.startDate,
    endDate:            updateData.endDate            ?? contract.endDate,
  });

  const plan = await db.CompensationPlan.findByPk(contract.idCompensationPlan);

  // ✅ Báo cho barber biết hợp đồng nháp vừa được cập nhật
  await notifyContractUpdated({
    idBarber:  contract.idBarber,
    planName:  plan?.displayName || "",
    startDate: contract.startDate,
  });

  return contract;
};

// ── CHẤM DỨT HỢP ĐỒNG ───────────────────────────────────────────────────
export const terminateContract = async (idContract) => {
  const contract = await db.SalaryContract.findByPk(idContract);
  if (!contract) throw new Error("Không tìm thấy hợp đồng.");

  const today = moment().format("YYYY-MM-DD");

  await contract.update({ status: "terminated", endDate: today });

  // ✅ Báo cho barber biết hợp đồng vừa bị chấm dứt
  await notifyContractTerminated({
    idBarber: contract.idBarber,
    today,
  });

  return contract;
};
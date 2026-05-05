"use strict";
import db from "../models/index.js";
import moment from "moment";
import { Op } from "sequelize";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER GUARD: Kiểm tra Plan có đang được dùng trong Salary đã lưu không
//
// Logic: Nếu tồn tại bất kỳ Salary nào (đã lock vào DB) mà barber đó
// đang dùng Plan này → KHÔNG được sửa CommissionRule / BonusRule
//
// Tại sao dùng SalaryContract để trace ngược?
// → Salary không lưu idCompensationPlan trực tiếp
// → Phải trace: Salary(idBarber) → SalaryContract(idBarber, idCompensationPlan)
//
// Worst case chấp nhận được: barber đã đổi plan nhưng salary cũ vẫn block
// → Đây là behavior đúng vì lương cũ đã được tính theo rule cũ
// ═══════════════════════════════════════════════════════════════════════════
const assertPlanRulesEditable = async (idCompensationPlan, transaction = null) => {
  // Lấy tất cả barber đang/từng dùng plan này
  const contractsUsingPlan = await db.SalaryContract.findAll({
    where: { idCompensationPlan },
    attributes: ["idBarber"],
    raw: true,
    transaction,
  });

  if (contractsUsingPlan.length === 0) return; // Không ai dùng → tự do sửa

  const barberIds = [...new Set(contractsUsingPlan.map((c) => c.idBarber))];

  // Kiểm tra có Salary nào đã lưu DB cho những barber này không
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

// Lấy danh sách các Cấp bậc đang áp dụng (Active Plans)
export const getAllActivePlans = async () => {
  const plans = await db.CompensationPlan.findAll({
    where: { effectiveTo: null },
    order: [["levelOrder", "ASC"]],
    include: [{
      model: db.CompensationPlan,
      as: "nextPlan",
      attributes: ["idCompensationPlan", "displayName"],
    }],
  });
  return plans;
};

// Tạo hoặc Cập nhật metadata của Cấp bậc
// ĐƯỢC PHÉP: Sửa tên, mô tả, levelOrder, defaultBaseSalary bất cứ lúc nào
// LƯU Ý: Sửa defaultBaseSalary chỉ ảnh hưởng hợp đồng ký MỚI SAU NÀY,
//         không ảnh hưởng hợp đồng đang chạy (actualBaseSalary đã được snapshot)
export const savePlan = async (planData) => {
  if (planData.idCompensationPlan) {
    await db.CompensationPlan.update(planData, {
      where: { idCompensationPlan: planData.idCompensationPlan },
    });
    return await db.CompensationPlan.findByPk(planData.idCompensationPlan);
  } else {
    planData.effectiveFrom = new Date();
    return await db.CompensationPlan.create(planData);
  }
};

// Xóa Plan
// KHÔNG ĐƯỢC PHÉP nếu còn barber nào đang dùng (contract active trỏ vào)
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

  // Soft-delete bằng SCD Type 2: ghi effectiveTo thay vì xóa vật lý
  await db.CompensationPlan.update(
    { effectiveTo: new Date() },
    { where: { idCompensationPlan } }
  );
};

// Lấy toàn bộ Rules (Hoa hồng & Thưởng) của một Cấp bậc
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

// ĐƯỢC PHÉP sửa khi: Plan chưa từng được dùng để tính Salary nào trong DB
// KHÔNG ĐƯỢC PHÉP khi: Đã có Salary record dùng Plan này → phải Clone Plan
export const saveCommissionRules = async (idCompensationPlan, rulesArray) => {
  const t = await db.sequelize.transaction();
  try {
    // ✅ GUARD: Kiểm tra trước khi cho phép sửa
    await assertPlanRulesEditable(idCompensationPlan, t);

    await db.CommissionRule.destroy({ where: { idCompensationPlan }, transaction: t });

    const dataToInsert = rulesArray.map((rule) => ({ ...rule, idCompensationPlan }));
    await db.CommissionRule.bulkCreate(dataToInsert, { transaction: t });

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

// Logic guard giống CommissionRules — cùng nguyên tắc bất biến
export const saveBonusRules = async (idCompensationPlan, rulesArray) => {
  const t = await db.sequelize.transaction();
  try {
    // ✅ GUARD: Kiểm tra trước khi cho phép sửa
    await assertPlanRulesEditable(idCompensationPlan, t);

    await db.BonusRule.destroy({ where: { idCompensationPlan }, transaction: t });

    const dataToInsert = rulesArray.map((rule) => ({ ...rule, idCompensationPlan }));
    await db.BonusRule.bulkCreate(dataToInsert, { transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLONE PLAN — Giải pháp khi Plan đã được dùng nhưng cần điều chỉnh rules
//
// Tạo bản copy của Plan với rules mới, effectiveFrom = today
// Barber muốn áp dụng rules mới → ký hợp đồng mới trỏ vào Plan clone
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

    // Tạo Plan mới — clone metadata, reset SCD dates
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

    // Clone toàn bộ CommissionRules
    if (original.commissionRules?.length > 0) {
      const commissionData = original.commissionRules.map(({ idCompensationPlan: _, idCommissionRule: __, ...rest }) => ({
        ...rest,
        idCompensationPlan: newPlan.idCompensationPlan,
      }));
      await db.CommissionRule.bulkCreate(commissionData, { transaction: t });
    }

    // Clone toàn bộ BonusRules
    if (original.bonusRules?.length > 0) {
      const bonusData = original.bonusRules.map(({ idCompensationPlan: _, idBonusRule: __, ...rest }) => ({
        ...rest,
        idCompensationPlan: newPlan.idCompensationPlan,
      }));
      await db.BonusRule.bulkCreate(bonusData, { transaction: t });
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

// Lấy danh sách thợ kèm hợp đồng hiện tại
export const getBarbersWithContracts = async () => {
  const barbers = await db.Barber.findAll({
    where: { isLocked: false },
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["fullName", "phoneNumber", "email"],
      },
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
  return barbers;
};

// ── KÝ HỢP ĐỒNG MỚI ─────────────────────────────────────────────────────
// ĐƯỢC PHÉP: Luôn luôn — tự động đóng hợp đồng cũ nếu có
export const assignContract = async (idBarber, contractData) => {
  const t = await db.sequelize.transaction();
  try {
    const today = moment().format("YYYY-MM-DD");

    // Tìm và đóng hợp đồng đang chạy
    const activeContract = await db.SalaryContract.findOne({
      where: { idBarber, status: "active" },
      transaction: t,
    });

    if (activeContract) {
      await activeContract.update(
        { status: "closed", endDate: today },
        { transaction: t }
      );
    }

    // Ký hợp đồng mới
    const newContract = await db.SalaryContract.create(
      {
        idBarber,
        idCompensationPlan: contractData.idCompensationPlan,
        actualBaseSalary:   contractData.actualBaseSalary,
        startDate:          contractData.startDate || today,
        endDate:            contractData.endDate || null,
        status:             "active",
      },
      { transaction: t }
    );

    await t.commit();
    return newContract;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ── SỬA HỢP ĐỒNG NHÁP ───────────────────────────────────────────────────
// ĐƯỢC PHÉP: Chỉ khi startDate > today (chưa có hiệu lực)
// KHÔNG ĐƯỢC PHÉP: Khi startDate <= today → phải chấm dứt + ký mới
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

  return contract;
};

// ── CHẤM DỨT HỢP ĐỒNG ───────────────────────────────────────────────────
// ĐƯỢC PHÉP: Luôn luôn — set endDate = today, status = terminated
export const terminateContract = async (idContract) => {
  const contract = await db.SalaryContract.findByPk(idContract);
  if (!contract) throw new Error("Không tìm thấy hợp đồng.");

  const today = moment().format("YYYY-MM-DD");

  return await contract.update({
    status:  "terminated",
    endDate: today,
  });
};
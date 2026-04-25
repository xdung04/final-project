"use strict";
import db from "../models/index.js";

// Lấy danh sách các Cấp bậc đang áp dụng (Active Plans)
export const getAllActivePlans = async () => {
  try {
    const plans = await db.CompensationPlan.findAll({
      where: { effectiveTo: null }, 
      order: [["levelOrder", "ASC"]],
      include: [
        {
          model: db.CompensationPlan,
          as: "nextPlan",
          attributes: ["idCompensationPlan", "displayName"],
        },
      ],
    });
    return plans;
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách cấp bậc: ${error.message}`);
  }
};

// Tạo hoặc Cập nhật Cấp bậc
export const savePlan = async (planData) => {
  try {
    if (planData.idCompensationPlan) {
      // Nếu có ID -> Cập nhật thông tin cơ bản (Không làm SCD Type 2 ở đây cho nhẹ)
      await db.CompensationPlan.update(planData, {
        where: { idCompensationPlan: planData.idCompensationPlan },
      });
      return await db.CompensationPlan.findByPk(planData.idCompensationPlan);
    } else {
      // Nếu không có ID -> Tạo mới
      planData.effectiveFrom = new Date(); // Gán ngày bắt đầu là hôm nay
      return await db.CompensationPlan.create(planData);
    }
  } catch (error) {
    throw new Error(`Lỗi khi lưu cấp bậc: ${error.message}`);
  }
};

// Lấy toàn bộ Luật (Hoa hồng & Thưởng) của một Cấp bậc
export const getRulesByPlan = async (idCompensationPlan) => {
  try {
    const commissionRules = await db.CommissionRule.findAll({
      where: { idCompensationPlan },
      order: [["minRevenueStep", "ASC"]],
    });

    const bonusRules = await db.BonusRule.findAll({
      where: { idCompensationPlan },
    });

    return { commissionRules, bonusRules };
  } catch (error) {
    throw new Error(`Lỗi khi lấy quy tắc: ${error.message}`);
  }
};

// Lưu danh sách Luật Hoa Hồng (Xóa cũ - Ghi mới bằng Transaction)
export const saveCommissionRules = async (idCompensationPlan, rulesArray) => {
  const t = await db.sequelize.transaction();
  try {
    // 1. Xóa sạch luật hoa hồng cũ của Plan này
    await db.CommissionRule.destroy({
      where: { idCompensationPlan },
      transaction: t,
    });

    // 2. Map lại mảng data và Insert mới toàn bộ
    const dataToInsert = rulesArray.map((rule) => ({
      ...rule,
      idCompensationPlan, // Đảm bảo gán đúng Plan ID
    }));
    await db.CommissionRule.bulkCreate(dataToInsert, { transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw new Error(`Lỗi khi lưu luật hoa hồng: ${error.message}`);
  }
};

// Lưu danh sách Luật Thưởng KPI (Xóa cũ - Ghi mới)
export const saveBonusRules = async (idCompensationPlan, rulesArray) => {
  const t = await db.sequelize.transaction();
  try {
    await db.BonusRule.destroy({
      where: { idCompensationPlan },
      transaction: t,
    });

    const dataToInsert = rulesArray.map((rule) => ({
      ...rule,
      idCompensationPlan,
    }));
    await db.BonusRule.bulkCreate(dataToInsert, { transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw new Error(`Lỗi khi lưu luật thưởng: ${error.message}`);
  }
};

// ==========================================
// PHẦN QUẢN LÝ HỢP ĐỒNG (TAB 3)
// ==========================================

// Lấy danh sách toàn bộ Thợ kèm theo Hợp đồng HIỆN TẠI của họ
export const getBarbersWithContracts = async () => {
  try {
    const barbers = await db.Barber.findAll({
      where: { isLocked: false },
      include: [
        { model: db.User, as: "user", attributes: ["fullName", "phoneNumber", "email"] }, // Giả định ông có join bảng User để lấy tên
        {
          model: db.SalaryContract,
          as: "contracts",
          where: { status: "active" },
          required: false, // LEFT JOIN (Để lấy cả thợ chưa có hợp đồng)
          include: [
            {
              model: db.CompensationPlan,
              as: "plan",
              attributes: ["idCompensationPlan", "displayName", "defaultBaseSalary"],
            },
          ],
        },
      ],
    });
    return barbers;
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách hợp đồng: ${error.message}`);
  }
};

// Cấp hợp đồng mới cho Thợ (Xử lý Đóng hợp đồng cũ -> Mở hợp đồng mới)
export const assignContract = async (idBarber, contractData) => {
  const t = await db.sequelize.transaction();
  try {
    // 1. Tìm xem thợ này có hợp đồng nào đang active không
    const activeContract = await db.SalaryContract.findOne({
      where: { idBarber, status: "active" },
      transaction: t,
    });

    // 2. Nếu có, "Đóng sổ" hợp đồng cũ (Chuyển status thành inactive, chốt endDate)
    if (activeContract) {
      await activeContract.update(
        {
          status: "inactive",
          endDate: new Date(),
        },
        { transaction: t }
      );
    }

    // 3. Tạo hợp đồng mới
    const newContract = await db.SalaryContract.create(
      {
        idBarber,
        idCompensationPlan: contractData.idCompensationPlan,
        actualBaseSalary: contractData.actualBaseSalary,
        contractType: contractData.contractType,
        startDate: contractData.startDate || new Date(),
        status: "active",
      },
      { transaction: t }
    );

    await t.commit();
    return newContract;
  } catch (error) {
    await t.rollback();
    throw new Error(`Lỗi khi ký hợp đồng mới: ${error.message}`);
  }
};
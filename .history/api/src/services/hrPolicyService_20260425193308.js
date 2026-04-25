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
        { model: db.User, as: "user", attributes: ["fullName", "phoneNumber", "email"] },
        {
          model: db.SalaryContract,
          as: "contracts", 
          where: { status: "active" }, 
          required: false, 
          // Không giới hạn attributes ở đây để Frontend lấy đủ idSalaryContract, startDate, endDate tính toán logic
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

// ==========================================
// 2. KÝ HỢP ĐỒNG MỚI (Tạo mới / Lên cấp / Tái ký)
// ==========================================
export const assignContract = async (idBarber, contractData) => {
  const t = await db.sequelize.transaction();
  try {
    const today = moment().format("YYYY-MM-DD");

    // 1. Tìm hợp đồng đang chạy của thợ
    const activeContract = await db.SalaryContract.findOne({
      where: { idBarber, status: "active" },
      transaction: t,
    });

    // 2. Nếu có, "Đóng sổ" hợp đồng cũ
    if (activeContract) {
      await activeContract.update(
        {
          status: "closed", 
          endDate: today,   
        },
        { transaction: t }
      );
    }

    // 3. Tạo hợp đồng mới tinh
    const newContract = await db.SalaryContract.create(
      {
        idBarber,
        idCompensationPlan: contractData.idCompensationPlan, 
        actualBaseSalary: contractData.actualBaseSalary,     
        startDate: contractData.startDate || today,
        endDate: contractData.endDate || null, 
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

// ==========================================
// 3. CẬP NHẬT HỢP ĐỒNG NHÁP (Logic Bất Biến)
// ==========================================
export const updatePendingContract = async (idContract, updateData) => {
  try {
    const contract = await db.SalaryContract.findByPk(idContract);

    if (!contract) {
      throw new Error("Không tìm thấy hợp đồng.");
    }

    const today = moment().format("YYYY-MM-DD");

    // 🔥 LOGIC VÀNG: Kiểm tra ngày bắt đầu
    if (moment(today).isSameOrAfter(contract.startDate)) {
      throw new Error("Hợp đồng này đã có hiệu lực, cấm chỉnh sửa! Vui lòng làm thủ tục chấm dứt hoặc ký mới nếu có thay đổi.");
    }

    // Nếu chưa tới ngày -> Cho sửa tẹt ga
    await contract.update({
      idCompensationPlan: updateData.idCompensationPlan || contract.idCompensationPlan,
      actualBaseSalary: updateData.actualBaseSalary || contract.actualBaseSalary,
      startDate: updateData.startDate || contract.startDate,
      endDate: updateData.endDate || contract.endDate,
    });

    return contract;
  } catch (error) {
    throw error; 
  }
};

// ==========================================
// 4. CHẤM DỨT HỢP ĐỒNG (Bổ sung để khớp Frontend)
// ==========================================
export const terminateContract = async (idContract) => {
  try {
    const contract = await db.SalaryContract.findByPk(idContract);
    if (!contract) throw new Error("Không tìm thấy hợp đồng.");

    const today = moment().format("YYYY-MM-DD");

    // Chốt sổ: Đổi trạng thái sang bị chấm dứt và ghi nhận ngày kết thúc
    return await contract.update({
      status: "terminated",
      endDate: today,
    });
  } catch (error) {
    throw error;
  }
};
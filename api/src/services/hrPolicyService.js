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
        where: { status: { [Op.in]: ["pending", "active"] } },
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

  // 🌟 Guard 3 CẬP NHẬT: Barber chưa có HD active HOẶC đang chờ kích hoạt (pending)
  const existing = await db.SalaryContract.findOne({
    where: { 
      idBarber, 
      status: { [Op.in]: ["active", "pending"] } // Kiểm tra cả 2 trạng thái
    },
  });
  
  if (existing) {
    if (existing.status === "active") {
      throw new Error(
        "Barber nay da co hop dong active. Dung 'Len cap' hoac 'Quyet toan' thay vi ky moi."
      );
    } else {
      throw new Error(
        `Barber nay da co mot hop dong dang cho kich hoat (bắt đầu từ ngày ${existing.startDate}). Khong the ky chong len nhau.`
      );
    }
  }

  // 🌟 CẬP NHẬT: Tạo hợp đồng với trạng thái "pending" thay vì "active"
  const newContract = await db.SalaryContract.create({
    idBarber,
    idCompensationPlan: contractData.idCompensationPlan,
    actualBaseSalary:   contractData.actualBaseSalary,
    startDate:          contractData.startDate,
    endDate:            null,
    status:             "pending", 
  });

  const plan = await db.CompensationPlan.findByPk(contractData.idCompensationPlan);
  
  // Vẫn gửi thông báo bình thường để Barber biết mình đã được lên lịch ký HD
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
  affectedCount: affectedBookings.length,
  affectedBookings: affectedBookings.map((b) => ({
    idBooking:   b.idBooking,
    bookingDate: b.bookingDate,
    customer: {
      fullName:    b.Customer?.user?.fullName    || "—",
      phoneNumber: b.Customer?.user?.phoneNumber || "—",
    },
  })),
};
};

// ── XAC NHAN SET NGAY NGHI + HUY BOOKING ─────────────────────────────────
export const confirmSetEndDate = async (idContract, endDate) => {
  const t = await db.sequelize.transaction();
  try {
    const contract = await db.SalaryContract.findByPk(idContract, { transaction: t });
    if (!contract) throw new Error("Khong tim thay hop dong.");
    if (contract.status !== "active") throw new Error("Chi thiet lap ngay nghi cho HD dang active.");

    const toVNDateOnly = (dateInput) => {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(dateInput));
    };

    const contractStartVN = toVNDateOnly(contract.startDate);
    const endDateVN = toVNDateOnly(endDate);
    const todayVN = toVNDateOnly(new Date());

    if (endDateVN <= contractStartVN) {
      throw new Error("Ngày kết thúc phải sau ngày bắt đầu hợp đồng.");
    }

    if (endDateVN <= todayVN) {
      throw new Error("Ngày kết thúc hợp đồng phải lớn hơn ngày hiện tại.");
    }

    if (contract.endDate) {
      throw new Error(
        `HD nay da co ngay ket thuc: ${contract.endDate}. Hay huy ngay nghi truoc khi thiet lap lai.`
      );
    }

    // 1. Cập nhật ngày kết thúc trên Hợp đồng
    await contract.update({ endDate }, { transaction: t });

    // 2. Đồng bộ lockDate cho Barber
    await db.Barber.update(
      { lockDate: endDate },
      {
        where: { idBarber: contract.idBarber },
        transaction: t,
      }
    );

    // 3. Tìm các lịch hẹn bị ảnh hưởng sau ngày nghỉ việc
    const affectedBookings = await db.Booking.findAll({
      where: {
        idBarber: contract.idBarber,
        bookingDate: { [Op.gt]: endDate },
        status: { [Op.notIn]: ["Cancelled", "Completed"] },
      },
      transaction: t,
    });

    if (affectedBookings.length > 0) {
      await db.Booking.update(
        { status: "Cancelled" },
        {
          where: { idBooking: { [Op.in]: affectedBookings.map((b) => b.idBooking) } },
          transaction: t,
        }
      );

      const bookingsWithCustomer = await db.Booking.findAll({
        where: { idBooking: { [Op.in]: affectedBookings.map((b) => b.idBooking) } },
        include: [{
          model: db.Customer,
          as: "Customer",
          attributes: ["idCustomer"],
        }],
        transaction: t,
      });

      const customerNotifications = bookingsWithCustomer.map((b) => ({
        type: "BOOKING",
        title: "Lịch hẹn đã bị hủy",
        content: `Lịch hẹn của bạn vào ngày ${new Date(b.bookingDate).toLocaleDateString("vi-VN")} đã được hủy bởi hệ thống. Chúng tôi xin lỗi vì sự bất tiện này và mong quý khách thông cảm. Vui lòng liên hệ hoặc đặt lại lịch hẹn với thợ khác tại hệ thống.`,
        targetRole: "customer",
        targetId: b.Customer?.idCustomer,
        referenceId: b.idBooking,
        isRead: false,
      }));

      await db.Notification.bulkCreate(customerNotifications, { transaction: t });
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
  const t = await db.sequelize.transaction();

  try {
    const contract = await db.SalaryContract.findByPk(idContract, { transaction: t });

    if (!contract) {
      throw new Error("Không tìm thấy hợp đồng.");
    }

    // chỉ cho hủy nếu đang có ngày kết thúc
    if (!contract.endDate) {
      throw new Error("Hợp đồng này chưa có ngày kết thúc để hủy.");
    }

    // nên chặn nếu HĐ không còn active
    if (contract.status !== "active") {
      throw new Error("Chỉ có thể hủy ngày kết thúc với hợp đồng đang active.");
    }

    // 1) Xóa ngày kết thúc của hợp đồng
    await contract.update(
      { endDate: null },
      { transaction: t }
    );

    // 2) Đồng bộ mở khóa barber
    await db.Barber.update(
      { lockDate: null },
      {
        where: { idBarber: contract.idBarber },
        transaction: t,
      }
    );

    await t.commit();

    // 3) Notification sau commit
    await notifyCancelEndDate({
      idBarber: contract.idBarber,
    });

    return {
      message: "Đã hủy ngày kết thúc hợp đồng.",
      contract,
      note: "Các booking đã bị hủy trước đó sẽ không được tự động khôi phục.",
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
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
    const endMoment        = moment(endDate);
    const month            = endMoment.month() + 1;         // tháng của endDate
    const year             = endMoment.year();
    const firstDayOfMonth  = moment(`${year}-${month}`, "YYYY-M").startOf("month");
    const lastDayOfMonth   = moment(`${year}-${month}`, "YYYY-M").endOf("month");
    const daysInMonth      = lastDayOfMonth.date(); // Số ngày trong tháng

    // Nếu endDate < cuối tháng, chỉ tính đến endDate
    const actualEndDate = endMoment.isBefore(lastDayOfMonth) ? endMoment : lastDayOfMonth;

    // ── BƯỚC 3: Kiểm tra chưa có Salary SETTLEMENT tháng này ─────────────
    const existingSettlement = await db.Salary.findOne({
      where: { idBarber, month, year, calculationType: "SETTLEMENT" },
      transaction: t,
    });
    if (existingSettlement) {
      throw new Error(`Barber này đã có phiếu quyết toán tháng ${month}/${year} rồi.`);
    }

    // ── BƯỚC 4: ✅ LẤY NGÀY NGHỈ (BarberDayOff) TRONG THÁNG ──────────────
    const dayOffs = await db.BarberDayOff.findAll({
      where: {
        idBarber,
        // Lấy những dayoff có overlap với tháng này
        // startDate <= endDate tháng & endDate >= startDate tháng
        [Op.and]: [
          { startDate: { [Op.lte]: actualEndDate.format("YYYY-MM-DD") } },
          { endDate:   { [Op.gte]: firstDayOfMonth.format("YYYY-MM-DD") } },
        ],
      },
      attributes: ["idUnavailable", "startDate", "endDate"],
      transaction: t,
    });

    // ✅ Tính tổng ngày nghỉ trong tháng
    let totalDaysOff = 0;
    const daysOffDetails = [];

    dayOffs.forEach((dayOff) => {
      // Xác định khoảng overlap giữa dayOff và tháng này
      const dayOffStart = moment(dayOff.startDate);
      const dayOffEnd   = moment(dayOff.endDate);

      // Ngày bắt đầu: max(dayOffStart, firstDayOfMonth)
      const actualStart = dayOffStart.isBefore(firstDayOfMonth) 
        ? firstDayOfMonth.clone() 
        : dayOffStart;

      // Ngày kết thúc: min(dayOffEnd, actualEndDate)
      const actualEnd = dayOffEnd.isAfter(actualEndDate) 
        ? actualEndDate.clone() 
        : dayOffEnd;

      // Số ngày overlap
      const daysCount = actualEnd.diff(actualStart, "days") + 1;

      if (daysCount > 0) {
        totalDaysOff += daysCount;
        daysOffDetails.push({
          period: `${actualStart.format("DD/MM/YYYY")} → ${actualEnd.format("DD/MM/YYYY")}`,
          days: daysCount,
          original: `${dayOff.startDate} → ${dayOff.endDate}`,
        });
      }
    });

    // ✅ Tính ngày làm việc thực tế
    const maxDaysInPeriod = actualEndDate.diff(firstDayOfMonth, "days") + 1;
    const daysWorked = maxDaysInPeriod - totalDaysOff;

    console.log(`📅 Tính lương tháng ${month}/${year}`);
    console.log(`   - Ngày trong tháng: ${daysInMonth}`);
    console.log(`   - Khoảng tính: ${firstDayOfMonth.format("DD/MM")} → ${actualEndDate.format("DD/MM")}`);
    console.log(`   - Tổng ngày: ${maxDaysInPeriod}`);
    console.log(`   - Ngày nghỉ: ${totalDaysOff}`);
    console.log(`   - Ngày làm: ${daysWorked}`);
    if (daysOffDetails.length > 0) {
      console.log(`   - Chi tiết nghỉ:`, daysOffDetails);
    }

    // ── BƯỚC 5: Lấy doanh thu, tips, số khách từ ngày 1 → endDate ────────
    const startDate = firstDayOfMonth.toDate();
    const endDateObj = actualEndDate.toDate();

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

    // ── BƯỚC 6: Lấy rating trung bình ────────────────────────────────────
    const ratingSummary = await db.BarberRatingSummary.findOne({
      where: { idBarber },
      transaction: t,
    });
    const averageRating = parseFloat(ratingSummary?.avgRate || 0);

    // ── BƯỚC 7: ✅ Tính lương (dựa vào daysWorked sau trừ dayoff) ────────
    // Lương cứng theo tỷ lệ ngày
    const baseSalary = (parseFloat(actualBaseSalary) / maxDaysInPeriod) * daysWorked;

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

    // ── BƯỚC 8: Tạo Salary SETTLEMENT ────────────────────────────────────
    const salary = await db.Salary.create(
      {
        idBarber,
        idContract,
        month,
        year,
        calculationType: "SETTLEMENT",
        daysWorked,       // ✅ Ngày làm việc thực tế (đã trừ dayoff)
        serviceRevenue,
        baseSalary:       Math.round(baseSalary),
        commission:       Math.round(commission),
        tips:             tipAmount,
        bonus:            Math.round(bonus),
        totalSalary:      Math.round(totalSalary),
        deductions:       0,
        netSalary:        Math.round(totalSalary),
        status:           "Paid", // Quyết toán → Paid ngay
        disputeCount:     0,
      },
      { transaction: t }
    );

    // ── BƯỚC 9: Tạo SalaryDeduction records ──────────────────────────────
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

    // ── BƯỚC 10: Đóng HĐ + Khóa Barber ──────────────────────────────────
    await contract.update(
      { status: "terminated" },
      { transaction: t }
    );

    await db.Barber.update(
      { lockDate: moment().format("YYYY-MM-DD") }, // ✅ Set lockDate thay vì isLocked
      { where: { idBarber }, transaction: t }
    );

    await t.commit();

    // ── BƯỚC 11: Notify barber (sau commit) ───────────────────────────────
    try {
      const { notifySettlementDone } = await import("./notificationService.js");
      await notifySettlementDone({
        idBarber,
        netSalary: salary.netSalary,
        idSalary:  salary.idSalary,
      });
    } catch (notifyErr) {
      console.error("⚠️ Lỗi gửi notification:", notifyErr.message);
      // Không throw - quyết toán đã thành công
    }

    return {
      salary,
      summary: {
        month,
        year,
        daysInMonth,           // Tổng ngày trong tháng
        periodDays: maxDaysInPeriod,  // Ngày từ 1 → endDate
        daysOff: totalDaysOff,        // Ngày thợ nghỉ
        daysWorked,            // Ngày thợ làm việc thực tế
        daysOffDetails,        // Chi tiết các khoảng nghỉ
        baseSalary:            Math.round(baseSalary),
        commission:            Math.round(commission),
        tips:                  tipAmount,
        bonus:                 Math.round(bonus),
        totalSalary:           Math.round(totalSalary),
        deductions:            salary.deductions,
        netSalary:             salary.netSalary,
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
// Thêm vào hrPolicyService.js
// Tính lương quyết toán để preview — KHÔNG lưu DB
export const previewSettlement = async (idContract) => {
  const contract = await db.SalaryContract.findByPk(idContract, {
    include: [{
      model: db.CompensationPlan,
      as: "plan",
      include: [
        { model: db.CommissionRule, as: "commissionRules" },
        { model: db.BonusRule,      as: "bonusRules" },
      ],
    }],
  });

  if (!contract)            throw new Error("Khong tim thay hop dong.");
  if (!contract.endDate)    throw new Error("Chua co endDate.");

  const { idBarber, actualBaseSalary, endDate, plan } = contract;

  const endMoment       = moment(endDate);
  const month           = endMoment.month() + 1;
  const year            = endMoment.year();
  const firstDayOfMonth = moment(`${year}-${month}`, "YYYY-M").startOf("month");
  const daysInMonth     = endMoment.daysInMonth();
  const daysWorked      = endMoment.diff(firstDayOfMonth, "days") + 1;

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
        bookingDate: {
          [Op.gte]: firstDayOfMonth.toDate(),
          [Op.lte]: endMoment.toDate(),
        },
      },
      attributes: [],
      include: [
        { model: db.BookingDetail, as: "BookingDetails", attributes: [] },
        { model: db.BookingTip,    as: "BookingTip",     attributes: [] },
      ],
    }],
    raw: true,
  });

  const serviceRevenue = parseFloat(revenueData?.serviceRevenue || 0);
  const tipAmount      = parseFloat(revenueData?.tipAmount      || 0);
  const customerCount  = parseInt(revenueData?.customerCount    || 0);

  const ratingSummary = await db.BarberRatingSummary.findOne({ where: { idBarber } });
  const averageRating = parseFloat(ratingSummary?.avgRate || 0);

  // Tính lương
  const baseSalary = (parseFloat(actualBaseSalary) / daysInMonth) * daysWorked;

  let commission = 0;
  if (plan?.commissionRules?.length > 0) {
    const matched = plan.commissionRules.find(
      (r) =>
        serviceRevenue >= parseFloat(r.minRevenueStep) &&
        (r.maxRevenueStep == null || serviceRevenue <= parseFloat(r.maxRevenueStep))
    );
    if (matched) commission = serviceRevenue * (parseFloat(matched.commissionRate) / 100);
  }

  let bonus = 0;
  if (plan?.bonusRules?.length > 0) {
    plan.bonusRules.forEach((rule) => {
      if (customerCount >= rule.minCustomerCount && averageRating >= parseFloat(rule.minAverageRating)) {
        bonus += parseFloat(rule.rewardAmount);
      }
    });
  }

  const totalSalary = baseSalary + commission + tipAmount + bonus;

  return {
    month,
    year,
    daysWorked,
    daysInMonth,
    baseSalaryFull: parseFloat(actualBaseSalary),
    baseSalary:     Math.round(baseSalary),
    commission:     Math.round(commission),
    tips:           tipAmount,
    bonus:          Math.round(bonus),
    totalSalary:    Math.round(totalSalary),
  };
};
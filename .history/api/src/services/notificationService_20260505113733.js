"use strict";
import db from "../models/index.js";
import { Op } from "sequelize";

const { Notification } = db;

// ═══════════════════════════════════════════════════════════════════════════
// GENERAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lấy tất cả thông báo của user (cho dropdown header)
 */
export const getUserAllNotifications = async ({ idUser, role }) => {
  return await Notification.findAll({
    where: {
      
      type: { [Op.in]: ["BOOKING", "SALARY", "SYSTEM"] },
      targetRole: { [Op.or]: [role, "all"] },
      [Op.or]: [
        { targetId: null },
        { targetId: idUser },
      ],
    },
    order: [["createdAt", "DESC"]],
    limit: 20,
    attributes: ["idNotification", "title", "content", "type", "createdAt", "isRead"],
  });
};

/**
 * Đánh dấu đã đọc
 */
export const markAsRead = async (idNotification) => {
  return await Notification.update(
    { isRead: true },
    { where: { idNotification } }
  );
};

/**
 * Tạo thông báo đơn lẻ (1 người nhận)
 * Không throw — chỉ log lỗi để không ảnh hưởng luồng chính
 */
export const createNotification = async (data) => {
  try {
    await Notification.create({
      type:        data.type,
      title:       data.title,
      content:     data.content || null,
      targetRole:  data.targetRole,
      targetId:    data.targetId || null,
      referenceId: data.referenceId || null,
      isRead:      false,
    });
  } catch (err) {
    console.error("Lỗi tạo thông báo:", err);
  }
};

/**
 * Tạo thông báo hàng loạt (nhiều người nhận) — chạy trong transaction
 * Throw lỗi để caller có thể rollback nếu cần
 */
export const bulkCreateNotifications = async (notifications, transaction = null) => {
  await Notification.bulkCreate(notifications, { transaction });
};

// ═══════════════════════════════════════════════════════════════════════════
// HR — HELPER NỘI BỘ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lấy idBarber đang dùng Plan cụ thể (để gửi thông báo hàng loạt)
 */
const getActiveBarberIdsByPlan = async (idCompensationPlan, transaction = null) => {
  const contracts = await db.SalaryContract.findAll({
    where: { idCompensationPlan, status: "active" },
    attributes: ["idBarber"],
    raw: true,
    transaction,
  });
  return [...new Set(contracts.map((c) => c.idBarber))];
};

// ═══════════════════════════════════════════════════════════════════════════
// HR — COMPENSATION PLAN EVENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hoa hồng thay đổi → notify tất cả barber đang dùng plan
 * Chạy trong transaction — rollback nếu lỗi
 */
export const notifyCommissionRulesChanged = async (idCompensationPlan, planName, transaction = null) => {
  const barberIds = await getActiveBarberIdsByPlan(idCompensationPlan, transaction);
  if (barberIds.length === 0) return;

  await bulkCreateNotifications(
    barberIds.map((id) => ({
      type:        "SYSTEM",
      title:       "Cập nhật chính sách hoa hồng",
      content:     `Bậc thang hoa hồng của cấp bậc "${planName}" vừa được cập nhật. Vui lòng kiểm tra lại chính sách lương của bạn.`,
      targetRole:  "barber",
      targetId:    id,
      referenceId: idCompensationPlan,
      isRead:      false,
    })),
    transaction
  );
};

/**
 * Thưởng KPI thay đổi → notify tất cả barber đang dùng plan
 * Chạy trong transaction — rollback nếu lỗi
 */
export const notifyBonusRulesChanged = async (idCompensationPlan, planName, transaction = null) => {
  const barberIds = await getActiveBarberIdsByPlan(idCompensationPlan, transaction);
  if (barberIds.length === 0) return;

  await bulkCreateNotifications(
    barberIds.map((id) => ({
      type:        "SYSTEM",
      title:       "Cập nhật chính sách thưởng KPI",
      content:     `Gói thưởng KPI của cấp bậc "${planName}" vừa được điều chỉnh. Vui lòng kiểm tra lại điều kiện nhận thưởng.`,
      targetRole:  "barber",
      targetId:    id,
      referenceId: idCompensationPlan,
      isRead:      false,
    })),
    transaction
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HR — CONTRACT EVENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ký hợp đồng mới → notify barber đó
 * Chạy SAU commit — lỗi chỉ log, không rollback hợp đồng
 */
export const notifyContractAssigned = async ({ idBarber, planName, startDate, endDate }) => {
  const end = endDate ? `đến ${endDate}` : "vô thời hạn";
  await createNotification({
    type:       "SYSTEM",
    title:      "Hợp đồng mới được ký",
    content:    `Bạn vừa được ký hợp đồng cấp bậc "${planName}", có hiệu lực từ ${startDate} ${end}.`,
    targetRole: "barber",
    targetId:   idBarber,
  });
};

/**
 * Sửa hợp đồng nháp → notify barber đó
 * Chạy SAU update — lỗi chỉ log
 */
export const notifyContractUpdated = async ({ idBarber, planName, startDate }) => {
  await createNotification({
    type:       "SYSTEM",
    title:      "Hợp đồng được cập nhật",
    content:    `Thông tin hợp đồng cấp bậc "${planName}" của bạn vừa được điều chỉnh, hiệu lực từ ${startDate}.`,
    targetRole: "barber",
    targetId:   idBarber,
  });
};

/**
 * Chấm dứt hợp đồng → notify barber đó
 * Chạy SAU update — lỗi chỉ log
 */
export const notifyContractTerminated = async ({ idBarber, today }) => {
  await createNotification({
    type:       "SYSTEM",
    title:      "Hợp đồng đã bị chấm dứt",
    content:    `Hợp đồng lao động của bạn đã được chấm dứt kể từ ngày ${today}. Vui lòng liên hệ quản lý để biết thêm chi tiết.`,
    targetRole: "barber",
    targetId:   idBarber,
  });
};
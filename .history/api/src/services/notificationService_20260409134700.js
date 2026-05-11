// services/notificationService.js
import db from "../models/index.js";
import { Op } from "sequelize";

const { Notification } = db;

/**
 * Lấy tất cả thông báo của user (cho dropdown header)
 */
export const getUserAllNotifications = async ({ idUser, role }) => {
  return await Notification.findAll({
    where: {
      type: {
        [Op.in]: ["BOOKING", "SALARY"],
      },
      targetRole: {
        [Op.or]: [role, "all"],
      },
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
 * Đánh dấu đã đọc (chỉ áp dụng cho thông báo cá nhân)
 */
export const markAsRead = async (idNotification) => {
  return await Notification.update(
    { isRead: true },
    { where: { idNotification } }
  );
};

/**
 * Tạo thông báo cá nhân (BOOKING, SALARY)
 */
export const createNotification = async (data) => {
  try {
    await Notification.create({
      type: data.type,
      title: data.title,
      content: data.content || null,
      targetRole: data.targetRole, // "customer" | "barber"
      targetId: data.targetId || null,
      isRead: false,
    });
  } catch (err) {
    console.error("Lỗi tạo thông báo:", err);
  }
};
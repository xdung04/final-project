// controllers/notificationController.js
import * as notificationService from "../services/notificationService.js";

/**
 * Lấy thông báo cho header (chỉ BOOKING & SALARY)
 */
export const getMyNotifications = async (req, res) => {
  try {
    const { idUser, role } = req.user;
    const notifications = await notificationService.getUserAllNotifications({
      idUser,
      role,
    });
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({
      unreadCount,
      notifications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Không thể lấy thông báo" });
  }
};

/**
 * Đánh dấu đã đọc thông báo
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Không thể cập nhật" });
  }
};
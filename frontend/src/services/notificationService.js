// src/services/notificationService.js
import notificationApi from "~/apis/notificationApi";

/* ================= HEADER NOTIFICATION ================= */

/**
 * Lấy danh sách thông báo + số lượng chưa đọc cho header
 */
export const fetchMyNotifications = async (token) => {
  try {
    const res = await notificationApi.getMyNotifications(token);
    return {
      unreadCount: res.data.unreadCount || 0,
      notifications: res.data.notifications || [],
    };
  } catch (error) {
    console.error("Lỗi fetch notifications:", error);
    return { unreadCount: 0, notifications: [] };
  }
};

/**
 * Đánh dấu đã đọc 1 thông báo
 */
export const markNotificationAsRead = async (id, token) => {
  try {
    await notificationApi.markAsRead(id, token);
    return true;
  } catch (error) {
    console.error("Lỗi mark as read:", error);
    return false;
  }
};
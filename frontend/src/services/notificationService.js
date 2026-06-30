// src/services/notificationService.js
import notificationApi from "~/apis/notificationApi";

/* ================= HEADER NOTIFICATION ================= */

/**
 * Lấy danh sách thông báo + số lượng chưa đọc cho header.
 *
 * Không còn cần truyền token — cookie tự gửi kèm.
 *
 * LƯU Ý: notificationApi giờ gọi qua httpRequest.js (request.get), mà các
 * hàm wrapper get/post/put trong httpRequest.js đã TỰ BÓC res.data ra rồi
 * (xem hàm get/post/... ở httpRequest.js: `return res && res.config ?
 * res.data : res`). Nghĩa là `res` ở đây đã CHÍNH LÀ phần data trả về từ BE,
 * không còn là object axios đầy đủ nữa — nên không dùng `res.data.xxx` như
 * lúc gọi axios gốc, mà dùng thẳng `res.xxx`.
 */
export const fetchMyNotifications = async () => {
  try {
    const res = await notificationApi.getMyNotifications();
    return {
      unreadCount: res.unreadCount || 0,
      notifications: res.notifications || [],
    };
  } catch (error) {
    console.error("Lỗi fetch notifications:", error);
    return { unreadCount: 0, notifications: [] };
  }
};

/**
 * Đánh dấu đã đọc 1 thông báo
 */
export const markNotificationAsRead = async (id) => {
  try {
    await notificationApi.markAsRead(id);
    return true;
  } catch (error) {
    console.error("Lỗi mark as read:", error);
    return false;
  }
};
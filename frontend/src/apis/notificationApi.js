// src/apis/notificationApi.js
import * as request from "~/apis/configs/httpRequest";

const notificationApi = {
  /**
   * Lấy thông báo của user hiện tại.
   * Không còn cần truyền token — cookie (httpOnly) tự gửi kèm nhờ
   * withCredentials: true đã cấu hình sẵn trong httpRequest.js.
   * Trước đây dùng axios gốc trực tiếp (không qua httpRequest.js) nên thiếu
   * withCredentials, khiến cookie không được gửi kèm dù đã đăng nhập -> 401.
   */
  getMyNotifications: () => request.get("/notifications"),

  /**
   * Đánh dấu đã đọc
   */
  markAsRead: (id) => request.put(`/notifications/${id}/read`, {}),
};

export default notificationApi;
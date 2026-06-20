import * as bookingService from "~/services/bookingHistoryService";

export const BookingHistoryAPI = {
  // 📋 Lấy lịch sử booking của khách hiện tại (Nhận thêm type và page từ UI)
  getBookingHistory: async (type = "upcoming", page = 1) => {
    // Nhớ truyền 'type' và 'page' vào trong hàm này
    const result = await bookingService.getBookingHistory(type, page);
    return result;
  },
};
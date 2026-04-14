import * as bookingService from "~/services/bookingHistoryService";

export const BookingHistoryAPI = {
  // 📋 Lấy lịch sử booking của khách hiện tại (token tự xác thực)
  getBookingHistory: async () => {
    const result = await bookingService.getBookingHistory();
    return result;
  },
};

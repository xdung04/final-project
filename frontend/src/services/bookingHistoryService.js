import * as request from "~/apis/configs/httpRequest";

// 📋 Lấy lịch sử booking của khách (dựa trên token)
export const getBookingHistory = async () => {
  try {
    const res = await request.get("/booking-history"); // không cần param, token tự xác thực
    console.log("API getBookingHistory trả về:", res);
    return res.data.data || res; // trả về data cho frontend
  } catch (error) {
    console.error(
      "Lỗi khi gọi API getBookingHistory:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

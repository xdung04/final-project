import * as request from "~/apis/configs/httpRequest";

// 📋 Lấy lịch sử booking của khách (dựa trên token)
export const getBookingHistory = async (type = "upcoming", page = 1) => {
  try {
    // Truyền params vào cấu hình của request.get
    const res = await request.get("/booking-history", {
      params: {
        type,
        page
      }
    }); 
    
    console.log("API getBookingHistory trả về:", res);
    
    // 👉 LƯU Ý: Trả về nguyên object "res.data" hoặc "res" tùy thuộc vào cấu trúc 
    // của axiosClient/httpRequest của bạn để Frontend nhận được cả thuộc tính "pagination".
    return res 
    
  } catch (error) {
    console.error(
      "Lỗi khi gọi API getBookingHistory:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

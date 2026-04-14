import * as request from "~/apis/configs/httpRequest";

// 📋 Lấy bảng đánh giá thợ theo idBarber
export const getRatingSummaryByBarber = async (idBarber) => {
  try {
    const res = await request.get(`/ratings/barber/${idBarber}`);
    console.log(`API getRatingSummaryByBarber trả về:`, res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API getRatingSummaryByBarber:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// ✏️ Cập nhật đánh giá thợ
export const updateRating = async (idBarber, newRate) => {
  try {
    const res = await request.post(`/ratings/barber/${idBarber}`, { rate: newRate });
    console.log(`API updateRating trả về:`, res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API updateRating:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// 📊 Lấy tất cả đánh giá thợ theo chi nhánh
export const getAllRatingsByBranch = async (idBranch) => {
  try {
    const res = await request.get(`/ratings/branch/${idBranch}`);
    console.log(`API getAllRatingsByBranch trả về:`, res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API getAllRatingsByBranch:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// services/summaryService.js
import * as request from "~/apis/configs/httpRequest";

/**
 * Lấy báo cáo tổng hợp cho 1 chi nhánh
 * @param {Object} params
 *  - branchIdLuong: id chi nhánh dùng cho bảng doanh thu thợ
 *  - branchIdRating: id chi nhánh dùng cho bảng rating
 *  - yearLuong, monthLuong: lọc doanh thu thợ
 *  - yearChiNhanh: lọc doanh thu chi nhánh
 * @returns {Promise<Object>} dữ liệu tổng hợp từ backend
 */
export const getSummary = async (params = {}) => {
  try {
    const res = await request.get("/statistics/summary", { params });

    // Nếu backend trả về success
    if (res?.success) {
      return res.data;
    } else {
      console.warn("Backend trả về lỗi:", res);
      throw new Error(res?.message || "Lấy báo cáo thất bại");
    }
  } catch (error) {
    console.error("Lỗi khi gọi API getBranchSummary:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

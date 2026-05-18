// services/statisticsService.js
import * as request from "~/apis/configs/httpRequest";

// Lấy doanh thu tất cả thợ
// filter = { month, year, branchId }
export const getBarberRevenue = async (filter = {}) => {
  try {
    const res = await request.get("/statistics/barbers", { params: filter });
    return res;
  } catch (error) {
    console.error("Lỗi getBarberRevenue:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Lấy tổng doanh thu từng tháng của chi nhánh trong năm
// params = { year, branchId }
export const getMonthlyBranchRevenue = async (year, branchId = null) => { // ← thêm branchId
  try {
    const params = { year };
    if (branchId) params.branchId = branchId; // ← gửi lên backend nếu có
    const res = await request.get("/statistics/branches", { params });
    return res;
  } catch (error) {
    console.error("Lỗi getMonthlyBranchRevenue:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Lấy tổng quan dashboard
// params = { month, year }
export const getDashboardOverview = async (params = {}) => {
  try {
    const res = await request.get("/statistics/overview", { params });
    return res;
  } catch (error) {
    console.error("Lỗi getDashboardOverview:", error.response?.data || error);
    throw error.response?.data || error;
  }
};
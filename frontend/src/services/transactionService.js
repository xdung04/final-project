// services/transactionService.js
import * as request from "~/apis/configs/httpRequest";

/**
 * Lấy danh sách giao dịch kèm bộ lọc và phân trang
 */
export const fetchTransactions = async (filters) => {
  try {
    return await request.get(`/transactions`, { params: filters });
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Lấy số liệu thống kê tổng hợp (4 thẻ doanh thu đầu trang)
 * 🌟 CẬP NHẬT: Nhận filters và truyền xuống query params của URL
 */
export const fetchSummaryStats = async (filters) => {
  try {
    return await request.get(`/transactions/stats`, { params: filters });
  } catch (error) {
    throw error.response?.data || error;
  }
};
// services/transactionService.js
import * as request from "~/apis/configs/httpRequest";

/**
 * Lấy danh sách giao dịch kèm bộ lọc và phân trang
 * @param {Object} filters - { search, dateFrom, dateTo, statusFilter, methodFilter, page, limit }
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
 */
export const fetchSummaryStats = async () => {
  try {
    return await request.get(`/transactions/stats`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

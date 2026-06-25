// api/transactionAPI.js
import * as transactionService from "~/services/transactionService";

export const TransactionAPI = {
  /**
   * Component gọi: await TransactionAPI.getTransactions({ page: 1, search: '...' })
   */
  getTransactions: async (filters) => {
    return await transactionService.fetchTransactions(filters);
  },

  /**
   * 🌟 CẬP NHẬT: Nhận filters từ React Component và chuyển tiếp vào Service
   */
  getSummaryStats: async (filters) => {
    return await transactionService.fetchSummaryStats(filters);
  },
};
import * as salaryService from "~/services/salaryService";

export const SalaryAPI = {
  /**
   * Lấy bảng lương theo tháng/năm (realtime)
   * @param {number} month Tháng
   * @param {number} year Năm
   */
  getSalaries: async (month, year) => {
    try {
      const res = await salaryService.fetchBarberSalaries(month, year);
      return res;
    } catch (error) {
      console.error("SalaryAPI.getSalaries lỗi:", error);
      throw error;
    }
  },

  /**
   * Tính/lưu lương toàn bộ thợ cho một tháng/năm
   * @param {number} month Tháng
   * @param {number} year Năm
   */
  calculateSalaries: async (month, year) => {
    try {
      const res = await salaryService.calculateBarberSalaries(month, year);
      return res;
    } catch (error) {
      console.error("SalaryAPI.calculateSalaries lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy tổng quan các tháng để frontend biết tháng nào đã tính, chưa tính
   */
  getSalaryOverview: async () => {
    try {
      const res = await salaryService.fetchSalaryOverview();
      return res;
    } catch (error) {
      console.error("SalaryAPI.getSalaryOverview lỗi:", error);
      throw error;
    }
  },
};

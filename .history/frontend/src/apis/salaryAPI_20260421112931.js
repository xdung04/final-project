import * as salaryService from "~/services/salaryService";

export const SalaryAPI = {
  // 1. Lấy bảng lương theo tháng/năm (realtime)
  getSalaries: async (month, year) => {
    try {
      return await salaryService.fetchBarberSalaries(month, year);
    } catch (error) {
      console.error("SalaryAPI.getSalaries lỗi:", error);
      throw error;
    }
  },

  // 2. Lấy tổng quan các tháng
  getSalaryOverview: async () => {
    try {
      return await salaryService.fetchSalaryOverview();
    } catch (error) {
      console.error("SalaryAPI.getSalaryOverview lỗi:", error);
      throw error;
    }
  },

  // 3. Tính & lưu nháp lương
  createDraftSalaries: async (month, year) => {
    try {
      return await salaryService.createDraftSalaries(month, year);
    } catch (error) {
      console.error("SalaryAPI.createDraftSalaries lỗi:", error);
      throw error;
    }
  },

  // 4. Gửi phiếu lương
  sendPayslip: async (idSalary) => {
    try {
      return await salaryService.sendPayslip(idSalary);
    } catch (error) {
      console.error("SalaryAPI.sendPayslip lỗi:", error);
      throw error;
    }
  },

  // 5. Điều chỉnh lương (Khấu trừ/Tạm ứng)
  adjustSalary: async (idSalary, payload) => {
    try {
      return await salaryService.adjustSalary(idSalary, payload);
    } catch (error) {
      console.error("SalaryAPI.adjustSalary lỗi:", error);
      throw error;
    }
  },

  // 6. Ép đóng khiếu nại
  forceCloseDispute: async (idSalary, reason) => {
    try {
      return await salaryService.forceCloseDispute(idSalary, reason);
    } catch (error) {
      console.error("SalaryAPI.forceCloseDispute lỗi:", error);
      throw error;
    }
  },

  // 7. Thanh toán & Khóa sổ
  markAsPaid: async (idSalary, payload) => {
    try {
      return await salaryService.markAsPaid(idSalary, payload);
    } catch (error) {
      console.error("SalaryAPI.markAsPaid lỗi:", error);
      throw error;
    }
  },
};
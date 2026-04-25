import * as salaryService from "~/services/salaryService";

export const SalaryAPI = {
  getSalaries: async (month, year) => {
    return await salaryService.fetchBarberSalaries(month, year);
  },

  getSalaryOverview: async () => {
    return await salaryService.fetchSalaryOverview();
  },

  createDraftSalaries: async (month, year) => {
    return await salaryService.createDraftSalaries(month, year);
  },

  sendPayslip: async (idSalary) => {
    return await salaryService.sendPayslip(idSalary);
  },

  adjustSalary: async (idSalary, payload) => {
    return await salaryService.adjustSalary(idSalary, payload);
  },

  forceCloseDispute: async (idSalary, reason) => {
    return await salaryService.forceCloseDispute(idSalary, reason);
  },

  markAsPaid: async (idSalary, payload) => {
    return await salaryService.markAsPaid(idSalary, payload);
  },

  getMyPayslips: async (accessToken) => {
    return await salaryService.fetchMyPayslips(accessToken);
  },

  confirmMyPayslip: async (idSalary, accessToken) => {
    return await salaryService.confirmMyPayslip(idSalary, accessToken);
  },

  disputeMyPayslip: async (idSalary, reason, accessToken) => {
    return await salaryService.disputeMyPayslip(idSalary, reason, accessToken);
  },
};
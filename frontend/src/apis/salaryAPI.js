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

addDeduction: async (idSalary, { amount, reason, violationDate }) => {
  return await salaryService.addDeduction(idSalary, { amount, reason, violationDate });
},

removeDeduction: async (idDeduction, deleteReason) => {
  return await salaryService.removeDeduction(idDeduction, deleteReason);
},

  forceCloseDispute: async (idSalary, reason) => {
    return await salaryService.forceCloseDispute(idSalary, reason);
  },

  markAsPaid: async (idSalary, payload) => {
    return await salaryService.markAsPaid(idSalary, payload);
  },
  getMyPayslips: async () => {
    return await salaryService.fetchMyPayslips();
  },

  confirmMyPayslip: async (idSalary) => {
    return await salaryService.confirmMyPayslip(idSalary);
  },

  disputeMyPayslip: async (idSalary, reason) => {
    return await salaryService.disputeMyPayslip(idSalary, reason);
  },
};
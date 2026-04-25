import * as salaryService from "~/services/salaryService";

export const SalaryAPI = {
  getSalaries: async (month, year) => {
    return await fetchBarberSalaries(month, year);
  },

  getSalaryOverview: async () => {
    return await fetchSalaryOverview();
  },

  createDraftSalaries: async (month, year) => {
    return await createDraftSalaries(month, year);
  },

  sendPayslip: async (idSalary) => {
    return await sendPayslip(idSalary);
  },

  adjustSalary: async (idSalary, payload) => {
    return await adjustSalary(idSalary, payload);
  },

  forceCloseDispute: async (idSalary, reason) => {
    return await forceCloseDispute(idSalary, reason);
  },

  markAsPaid: async (idSalary, payload) => {
    return await markAsPaid(idSalary, payload);
  },

  getMyPayslips: async (accessToken) => {
    return await fetchMyPayslips(accessToken);
  },

  confirmMyPayslip: async (idSalary, accessToken) => {
    return await confirmMyPayslip(idSalary, accessToken);
  },

  disputeMyPayslip: async (idSalary, reason, accessToken) => {
    return await disputeMyPayslip(idSalary, reason, accessToken);
  },
};
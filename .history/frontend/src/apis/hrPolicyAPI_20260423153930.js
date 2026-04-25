import * as hrPolicyService from "~/services/hrPolicyService";

export const HrPolicyAPI = {
  // Tab 1: Cấp bậc
  getActivePlans: async () => {
    return await hrPolicyService.fetchActivePlans();
  },

  savePlan: async (payload) => {
    return await hrPolicyService.savePlan(payload);
  },

  // Tab 2: Luật hoa hồng & thưởng
  getRulesByPlan: async (idPlan) => {
    return await hrPolicyService.fetchRulesByPlan(idPlan);
  },

  saveCommissionRules: async (idPlan, rules) => {
    return await hrPolicyService.saveCommissionRules(idPlan, rules);
  },

  saveBonusRules: async (idPlan, rules) => {
    return await hrPolicyService.saveBonusRules(idPlan, rules);
  },

  // Tab 3: Hợp đồng
  getBarbersContracts: async () => {
    return await hrPolicyService.fetchBarbersContracts();
  },

  assignContract: async (idBarber, payload) => {
    return await hrPolicyService.assignContract(idBarber, payload);
  },
};
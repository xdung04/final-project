import * as hrPolicyService from "~/services/hrPolicyService";

export const HrPolicyAPI = {
  // Tab 1: Cấp bậc
  getActivePlans: async () => {
    return await hrPolicyService.fetchActivePlans();
  },

  savePlan: async (payload) => {
    return await hrPolicyService.savePlan(payload);
  },

  // 🔥 THÊM MỚI: Xóa cấp bậc (409 nếu còn thợ đang dùng)
  deletePlan: async (idPlan) => {
    return await hrPolicyService.deletePlan(idPlan);
  },

  // 🔥 THÊM MỚI: Clone cấp bậc (khi Plan đã bị lock bởi Salary)
  clonePlan: async (idPlan) => {
    return await hrPolicyService.clonePlan(idPlan);
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

  updatePendingContract: async (idContract, payload) => {
    return await hrPolicyService.updatePendingContract(idContract, payload);
  },

  terminateContract: async (idContract) => {
    return await hrPolicyService.terminateContract(idContract);
  },
  // ── MỚI: Preview booking bị hủy trước khi set endDate
  previewEndDate: async (idContract, endDate) => {
    return await hrPolicyService.previewEndDate(idContract, endDate);
  },

  // ── MỚI: Xác nhận thiết lập ngày nghỉ + hủy booking
  setEndDate: async (idContract, endDate) => {
    return await hrPolicyService.setEndDate(idContract, endDate);
  },

  // ── MỚI: Hủy ngày nghỉ
  cancelEndDate: async (idContract) => {
    return await hrPolicyService.cancelEndDate(idContract);
  },

  // ── MỚI: Lên cấp
  promoteBarber: async (idContract, payload) => {
    return await hrPolicyService.promoteBarber(idContract, payload);
  },

  // ── MỚI: Quyết toán & chấm dứt (thay terminateContract)
  settleContract: async (idContract, deductions = []) => {
    return await hrPolicyService.settleContract(idContract, deductions);
  },

  // ❌ XÓA: terminateContract — đã thay bằng settleContract
};

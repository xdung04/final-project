import * as request from "~/apis/configs/httpRequest";

// ==========================================
// 1. QUẢN LÝ CẤP BẬC (COMPENSATION PLANS)
// ==========================================

export const fetchActivePlans = async () => {
  try {
    return await request.get(`/hr-policy/plans`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const savePlan = async (payload) => {
  try {
    return await request.post(`/hr-policy/plans`, payload);
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 🔥 THÊM MỚI: Xóa cấp bậc
export const deletePlan = async (idPlan) => {
  try {
    return await request.del(`/hr-policy/plans/${idPlan}`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 🔥 THÊM MỚI: Clone cấp bậc (khi Plan đã bị lock bởi Salary)
export const clonePlan = async (idPlan) => {
  try {
    return await request.post(`/hr-policy/plans/${idPlan}/clone`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ==========================================
// 2. QUẢN LÝ QUY TẮC (COMMISSION & BONUS RULES)
// ==========================================

export const fetchRulesByPlan = async (idPlan) => {
  try {
    return await request.get(`/hr-policy/plans/${idPlan}/rules`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveCommissionRules = async (idPlan, rules) => {
  try {
    return await request.post(`/hr-policy/plans/${idPlan}/commission-rules`, { rules });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveBonusRules = async (idPlan, rules) => {
  try {
    return await request.post(`/hr-policy/plans/${idPlan}/bonus-rules`, { rules });
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ==========================================
// 3. QUẢN LÝ HỢP ĐỒNG (CONTRACTS)
// ==========================================

export const fetchBarbersContracts = async () => {
  try {
    return await request.get(`/hr-policy/barbers-contracts`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const assignContract = async (idBarber, payload) => {
  try {
    return await request.post(`/hr-policy/barbers/${idBarber}/assign-contract`, payload);
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ✅ FIX: Thêm prefix /hr-policy (trước đang thiếu)
export const updatePendingContract = async (idContract, payload) => {
  try {
    return await request.put(`/hr-policy/contracts/${idContract}/update-pending`, payload);
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ✅ FIX: Thêm prefix /hr-policy (trước đang thiếu)
export const terminateContract = async (idContract) => {
  try {
    return await request.post(`/hr-policy/contracts/${idContract}/terminate`);
  } catch (error) {
    throw error.response?.data || error;
  }
};
// ==========================================
// 3. CONTRACTS — BỔ SUNG
// ==========================================

export const previewEndDate = async (idContract, endDate) => {
  try {
    return await request.post(`/hr-policy/contracts/${idContract}/preview-end-date`, { endDate });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const setEndDate = async (idContract, endDate) => {
  try {
    return await request.post(`/hr-policy/contracts/${idContract}/set-end-date`, { endDate });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const cancelEndDate = async (idContract) => {
  try {
    return await request.del(`/hr-policy/contracts/${idContract}/end-date`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const promoteBarber = async (idContract, payload) => {
  // payload = { idCompensationPlan, actualBaseSalary, salaryPeriod: { month, year } }
  try {
    return await request.post(`/hr-policy/contracts/${idContract}/promote`, payload);
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const settleContract = async (idContract, deductions = []) => {
  // deductions = [{ amount, reason, violationDate }]
  try {
    return await request.post(`/hr-policy/contracts/${idContract}/settle`, { deductions });
  } catch (error) {
    throw error.response?.data || error;
  }
};// FE: hrPolicyService.js
export const cancelPendingContract = async (idContract) => {
  try {
    return await request.del(`/hr-policy/contracts/${idContract}/pending`);
  } catch (error) {
    throw error.response?.data || error;
  }
};
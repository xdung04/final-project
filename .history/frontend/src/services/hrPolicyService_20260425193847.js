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
    // Đẩy mảng rules vào trong body object cho khớp với req.body.rules ở backend
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
export const updatePendingContract = async (idContract, payload) => {
  // Nhớ đổi prefix '/api/...' cho khớp với cấu hình của ông
  const response = await axiosClient.put(`/contracts/${idContract}/update-pending`, payload);
  return response.data; // Hoặc trả về response tuỳ cấu hình interceptor
};

// Chấm dứt hợp đồng (Dùng POST)
export const terminateContract = async (idContract) => {
  const response = await axiosClient.post(`/contracts/${idContract}/terminate`);
  return response.data;
};
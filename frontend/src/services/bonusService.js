// services/bonusRuleService.js
import * as request from "~/apis/configs/httpRequest";

// Tạo rule mới
export const createBonusRule = async (ruleData) => {
  try {
    if (ruleData.minRevenue === undefined || ruleData.minRevenue === null ||
        ruleData.bonusPercent === undefined || ruleData.bonusPercent === null) {
      throw { message: "Missing required bonus rule fields" };
    }

    const res = await request.post("/bonus", ruleData);
    console.log("API createBonusRule trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API createBonusRule:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Lấy tất cả rule
export const getAllBonusRules = async () => {
  try {
    const res = await request.get("/bonus");
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Lấy các rule đang active
export const getActiveBonusRules = async () => {
  try {
    const res = await request.get("/bonus/active");
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Lấy rule theo id
export const getBonusRuleById = async (id) => {
  try {
    const res = await request.get(`/bonus/${id}`);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Cập nhật rule
export const updateBonusRule = async (id, updateData) => {
  try {
    const res = await request.put(`/bonus/${id}`, updateData);
    console.log("API updateBonusRule trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API updateBonusRule:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Xoá rule (soft delete)
export const deleteBonusRule = async (id) => {
  try {
    const res = await request.del(`/bonus/${id}`);
    console.log("API deleteBonusRule trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API deleteBonusRule:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Lấy rule áp dụng theo doanh thu
export const getApplicableBonusRule = async (revenue) => {
  try {
    const res = await request.get(`/bonus/applicable?revenue=${revenue}`);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

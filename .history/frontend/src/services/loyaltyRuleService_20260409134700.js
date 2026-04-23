// services/loyaltyRuleService.js
import * as request from "~/apis/configs/httpRequest";

// Tạo rule mới
export const createLoyaltyRule = async (ruleData) => {
  try {
    if (!ruleData.money_per_point || !ruleData.point_multiplier || (!ruleData.is_default && (!ruleData.start_date || !ruleData.end_date))) {
      throw { message: "Missing required loyalty rule fields" };
    }
    const res = await request.post("/loyalty-rules", ruleData);
    console.log("API createLoyaltyRule trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API createLoyaltyRule:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Lấy tất cả rule
export const getAllLoyaltyRules = async () => {
  try {
    const res = await request.get("/loyalty-rules");
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Lấy các rule đang active
export const getActiveLoyaltyRules = async () => {
  try {
    const res = await request.get("/loyalty-rules/active");
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Lấy rule mặc định
export const getDefaultLoyaltyRule = async () => {
  try {
    const res = await request.get("/loyalty-rules/default");
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Lấy rule áp dụng hiện tại
export const getApplicableLoyaltyRule = async () => {
  try {
    const res = await request.get("/loyalty-rules/applicable");
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Lấy rule theo id
export const getLoyaltyRuleById = async (id) => {
  try {
    const res = await request.get(`/loyalty-rules/${id}`);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Cập nhật rule
export const updateLoyaltyRule = async (id, updateData) => {
  try {
    const res = await request.put(`/loyalty-rules/${id}`, updateData);
    console.log("API updateLoyaltyRule trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API updateLoyaltyRule:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Xoá rule
export const deleteLoyaltyRule = async (id) => {
  try {
    const res = await request.del(`/loyalty-rules/${id}`);
    console.log("API deleteLoyaltyRule trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API deleteLoyaltyRule:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

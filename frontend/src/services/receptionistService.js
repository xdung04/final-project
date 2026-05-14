import * as request from "~/apis/configs/httpRequest";

// Lấy thông tin lễ tân theo idBranch
export const getReceptionistByBranch = async (idBranch) => {
  try {
    const res = await request.get(`/receptionist/branch/${idBranch}`);
    return res;
  } catch (error) {
    console.error("Lỗi getReceptionistByBranch:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Admin cập nhật thông tin lễ tân
export const updateReceptionistByBranch = async (idBranch, data) => {
  try {
    const res = await request.put(`/receptionist/branch/${idBranch}`, data);
    return res;
  } catch (error) {
    console.error("Lỗi updateReceptionistByBranch:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

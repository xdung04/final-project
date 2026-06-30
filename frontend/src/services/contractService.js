import * as request from "~/apis/configs/httpRequest";

/**
 * Lấy hợp đồng đang active của barber đang đăng nhập
 * @returns {Promise<Object>} thông tin hợp đồng
 */
export const getMyContract = async () => {
  try {
    const res = await request.get("/contracts/my-contract");

    if (res?.success) {
      return res.data;
    } else {
      console.warn("Backend trả về lỗi:", res);
      throw new Error(res?.message || "Lấy hợp đồng thất bại");
    }
  } catch (error) {
    console.error("Lỗi khi gọi API getMyContract:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

/**
 * Lấy toàn bộ lịch sử hợp đồng của barber đang đăng nhập
 * @returns {Promise<Array>} danh sách hợp đồng
 */
export const getMyContractHistory = async () => {
  try {
    const res = await request.get("/contracts/my-history");

    if (res?.success) {
      return res.data;
    } else {
      console.warn("Backend trả về lỗi:", res);
      throw new Error(res?.message || "Lấy lịch sử hợp đồng thất bại");
    }
  } catch (error) {
    console.error("Lỗi khi gọi API getMyContractHistory:", error.response?.data || error);
    throw error.response?.data || error;
  }
};
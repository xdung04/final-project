import * as request from "~/apis/configs/httpRequest";

/**
 * Lấy bảng lương thợ cắt tóc theo tháng và năm
 * @param {number} month Tháng
 * @param {number} year Năm
 * @returns {Promise<Array>} Mảng dữ liệu lương
 */
export const fetchBarberSalaries = async (month, year) => {
  try {
    const res = await request.get(`/salary?month=${month}&year=${year}`);
    console.log("fetchBarberSalaries trả về:", res);
    return res; // trả về dữ liệu lương từ backend
  } catch (error) {
    console.error("Lỗi khi fetch bảng lương:", error);
    throw error.response?.data || error;
  }
};

/**
 * Gửi yêu cầu lưu/tính lương cho tháng/năm
 * @param {number} month Tháng
 * @param {number} year Năm
 * @returns {Promise<any>}
 */
export const calculateBarberSalaries = async (month, year) => {
  try {
    const res = await request.post(`/salary/confirm`, { month, year });
    console.log("calculateBarberSalaries trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi tính lương:", error);
    throw error.response?.data || error;
  }
};

/**
 * Lấy tổng quan lương các tháng (cả tháng hiện tại & các tháng trước)
 * @returns {Promise<Array>} Mảng dữ liệu tháng + status + salaries
 */
export const fetchSalaryOverview = async () => {
  try {
    const res = await request.get(`/salary/overview`);
    console.log("fetchSalaryOverview trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi fetch salary overview:", error);
    throw error.response?.data || error;
  }
};

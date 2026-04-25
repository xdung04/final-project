import * as request from "~/apis/configs/httpRequest";

/**
 * 1. Lấy bảng lương thợ cắt tóc theo tháng và năm (real-time)
 */
export const fetchBarberSalaries = async (month, year) => {
  try {
    const res = await request.get(`/salary?month=${month}&year=${year}`);
    return res; 
  } catch (error) {
    console.error("Lỗi khi fetch bảng lương:", error);
    throw error.response?.data || error;
  }
};

/**
 * 2. Lấy tổng quan lương các tháng
 */
export const fetchSalaryOverview = async () => {
  try {
    const res = await request.get(`/salary/overview`);
    return res;
  } catch (error) {
    console.error("Lỗi khi fetch salary overview:", error);
    throw error.response?.data || error;
  }
};

/**
 * 3. Tạo bản nháp lương (Draft) cho tháng/năm (Thay cho confirm cũ)
 */
export const createDraftSalaries = async (month, year) => {
  try {
    const res = await request.post(`/salary/draft`, { month, year });
    return res;
  } catch (error) {
    console.error("Lỗi khi lưu nháp lương:", error);
    throw error.response?.data || error;
  }
};

/**
 * 4. Gửi phiếu lương cho thợ
 */
export const sendPayslip = async (idSalary) => {
  try {
    const res = await request.post(`/salary/${idSalary}/send`);
    return res;
  } catch (error) {
    console.error("Lỗi khi gửi phiếu lương:", error);
    throw error.response?.data || error;
  }
};

/**
 * 5. Điều chỉnh lương (Phạt / Tạm ứng)
 * @param {Object} payload { advance, deduction, adjustmentNote }
 */
export const adjustSalary = async (idSalary, payload) => {
  try {
    const res = await request.put(`/salary/${idSalary}/adjust`, payload);
    return res;
  } catch (error) {
    console.error("Lỗi khi điều chỉnh lương:", error);
    throw error.response?.data || error;
  }
};

/**
 * 6. Ép đóng khiếu nại
 * @param {string} reason Lý do từ chối khiếu nại
 */
export const forceCloseDispute = async (idSalary, reason) => {
  try {
    const res = await request.post(`/salary/${idSalary}/force-close`, { reason });
    return res;
  } catch (error) {
    console.error("Lỗi khi đóng khiếu nại:", error);
    throw error.response?.data || error;
  }
};

/**
 * 7. Thanh toán & Khóa sổ
 * @param {Object} payload { paidAmount, paymentProofUrl }
 */
export const markAsPaid = async (idSalary, payload) => {
  try {
    const res = await request.post(`/salary/${idSalary}/pay`, payload);
    return res;
  } catch (error) {
    console.error("Lỗi khi thanh toán lương:", error);
    throw error.response?.data || error;
  }
};
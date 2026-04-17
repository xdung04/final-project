// ~/services/paymentService.js
import * as request from "~/apis/configs/httpRequest";

/**
 * Gọi API Backend để tạo giao dịch thanh toán
 */
export const createPayment = async (idBooking, payload) => {
  try {
    const res = await request.post(`/payment/${idBooking}/create`, payload);
    console.log("API createPayment trả về:", res);
    return res; 
  } catch (error) {
    console.error(
      "Lỗi khi gọi API createPayment:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

/**
 * (Tùy chọn) Gọi API để verify lại kết quả thanh toán từ phía Client
 */
export const verifyVnpayReturn = async (queryParams) => {
  try {
    const res = await request.get("/payment/vnpay_return", {
      params: queryParams
    });
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API verifyVnpayReturn:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};
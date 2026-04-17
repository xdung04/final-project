// ~/apis/paymentApi.js
import * as paymentService from "~/services/paymentService";

export const PaymentAPI = {
  /**
   * Tạo yêu cầu thanh toán (CASH hoặc VNPAY)
   * payload: { method, total, tip, services }
   */
  create: async (idBooking, payload) => {
    return await paymentService.createPayment(idBooking, payload);
  },

  /**
   * Verify kết quả trả về từ VNPAY (nếu cần xử lý thêm ở FE)
   */
  verifyVnpay: async (queryParams) => {
    return await paymentService.verifyVnpayReturn(queryParams);
  }
};
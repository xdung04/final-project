
import * as paymentService from "~/services/paymentService";

export const PaymentAPI = {
  /**
   * Tạo yêu cầu thanh toán (CASH hoặc VNPAY)
   * payload: { method, total, tip, services }
   */
  createPayment: async (idBooking, payload) => {
    return await paymentService.createPayment(idBooking, payload);
  },

  verifyVnpay: async (queryParams) => {
    return await paymentService.verifyVnpayReturn(queryParams);
  }
};
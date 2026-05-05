import * as contractService from "~/services/contractService";

export const ContractAPI = {
  /**
   * Lấy hợp đồng đang active của barber đang đăng nhập
   * @returns {Promise<Object>} thông tin hợp đồng
   */
  getMyContract: async () => {
    try {
      const result = await contractService.getMyContract();
      return result;
    } catch (error) {
      console.error("ContractAPI.getMyContract lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy toàn bộ lịch sử hợp đồng của barber đang đăng nhập
   * @returns {Promise<Array>} danh sách hợp đồng
   */
  getMyContractHistory: async () => {
    try {
      const result = await contractService.getMyContractHistory();
      return result;
    } catch (error) {
      console.error("ContractAPI.getMyContractHistory lỗi:", error);
      throw error;
    }
  },
};
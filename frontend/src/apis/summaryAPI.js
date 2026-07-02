import * as summaryService from "~/services/summaryService";

export const SummaryAPI = {

  /**
   * Lấy báo cáo tổng hợp cho chi nhánh
   * @param {Object} params
   *  - branchIdLuong: id chi nhánh doanh thu thợ
   *  - branchIdRating: id chi nhánh đánh giá
   *  - yearLuong, monthLuong: lọc doanh thu thợ
   *  - yearChiNhanh: lọc doanh thu chi nhánh
   */
  getSummary: async (params) => {
    try {
      const result = await summaryService.getSummary(params);
      return result;
    } catch (error) {
      console.error("SummaryAPI.getBranchSummary lỗi:", error);
      throw error;
    }
  },
  getAISummary: async () => {
  try {
    const result = await summaryService.getAISummary();
    return result;
  } catch (error) {
    console.error("SummaryAPI.getAISummary lỗi:", error);
    throw error;
  }
},

};

import * as hairAnalysisService from "~/services/hairAnalysisService";
 
export const HairAnalysisAPI = {
  // Lưu kết quả sau khi xem recommendation
  saveAnalysis: async ({ _saveToken, selectedHairstyleName }) => {
    try {
      const res = await hairAnalysisService.saveAnalysis({
        _saveToken,
        selectedHairstyleName: selectedHairstyleName || null,
      });
      console.log("HairAnalysisAPI.saveAnalysis trả về:", res);
      return res;
    } catch (error) {
      console.error("Lỗi HairAnalysisAPI.saveAnalysis:", error);
      throw error;
    }
  },
 
  // Đánh giá 1-5 sao + feedback
  rateAnalysis: async (idAnalysis, { rating, feedback }) => {
    try {
      const res = await hairAnalysisService.rateAnalysis(idAnalysis, {
        rating,
        feedback: feedback || null,
      });
      console.log("HairAnalysisAPI.rateAnalysis trả về:", res);
      return res;
    } catch (error) {
      console.error("Lỗi HairAnalysisAPI.rateAnalysis:", error);
      throw error;
    }
  },
 
  // Lấy lịch sử phân tích của khách
  getMyHistory: async () => {
    try {
      const res = await hairAnalysisService.getMyHistory();
      console.log("HairAnalysisAPI.getMyHistory trả về:", res);
      return res;
    } catch (error) {
      console.error("Lỗi HairAnalysisAPI.getMyHistory:", error);
      throw error;
    }
  },
};
 
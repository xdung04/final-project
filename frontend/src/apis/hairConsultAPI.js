import * as hairConsultService from "~/services/hairConsultService";

export const HairConsultAPI = {
  getQuiz: async () => {
    try {
      const res = await hairConsultService.getQuiz();
      console.log("HairConsultAPI.getQuiz trả về:", res);
      return res;
    } catch (error) {
      console.error("Lỗi HairConsultAPI.getQuiz:", error);
      throw error;
    }
  },

  generateRecommendation: async (quizAnswers) => {
    try {
      const res = await hairConsultService.generateRecommendation(quizAnswers);
      console.log("HairConsultAPI.generateRecommendation trả về:", res);
      return res;
    } catch (error) {
      console.error("Lỗi HairConsultAPI.generateRecommendation:", error);
      throw error;
    }
  },
};

import hairConsultService from "../services/hairConsultService.js";

// 🔹 GET /quiz
const getQuiz = async (req, res) => {
  try {
    console.log("Frontend request GET /quiz");
    const quiz = await hairConsultService.getQuiz();
    console.log("Quiz data:", quiz);
    return res.json({ quiz });
  } catch (err) {
    console.error("Lỗi getQuiz:", err);
    return res.status(500).json({ message: "Lỗi server khi lấy quiz", error: err.message });
  }
};

// 🔹 POST /recommendation
export const generateRecommendation = async (req, res) => {
  try {
    const { flow, quizAnswers, faceMetrics } = req.body;

    if (!flow || !flow.id)
      return res.status(400).json({ message: "Thiếu flow id" });

    if (!quizAnswers || Object.keys(quizAnswers).length === 0)
      return res.status(400).json({ message: "Thiếu câu trả lời quiz" });

    const recommendation = await hairConsultService.analyzeHairConsult({
      flow,
      answers: quizAnswers,
      faceMetrics: faceMetrics || null,
    });

    return res.json({
      ...recommendation,
      message: `Gợi ý kiểu tóc: ${recommendation.recommendedStyles.join(", ")}`,
    });
  } catch (err) {
    console.error("Lỗi generateRecommendation:", err);
    return res.status(500).json({ message: "Lỗi server khi tạo gợi ý", error: err.message });
  }
};







export default {
  getQuiz,
  generateRecommendation,
};

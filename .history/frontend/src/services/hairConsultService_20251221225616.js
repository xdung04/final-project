import * as request from "~/apis/configs/httpRequest";

// Lấy quiz
export const getQuiz = async () => {
  try {
    const res = await request.get("/hair-consult/quiz");
    console.log("getQuiz trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi getQuiz:", error);
    throw error.response?.data || error;
  }
};

// Gửi quiz answers để nhận gợi ý
export const generateRecommendation = async (payload) => {
  try {
    const res = await request.post("/hair-consult/recommendation", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("generateRecommendation trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi generateRecommendation:", error);
    throw error.response?.data || error;
  }
};

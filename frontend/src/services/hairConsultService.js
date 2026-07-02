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
export const generateRecommendation = async (formData) => {
  try {
    console.log([...formData.entries()]);

    const res = await request.post(
      "/hair-consult/recommendation",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", 
        },
      }
    );
    return res;
  } catch (error) {
    console.error("Lỗi generateRecommendation:", error);
    throw error.response?.data || error;
  }
};

// Validate ảnh trước khi submit
export const validateFace = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile); // ← khớp với route upload.single("image")

    const res = await request.post(
      "/hair-consult/validate-face",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res;
  } catch (error) {
    // Trả về lỗi validate (422) để frontend xử lý hiển thị message
    throw error.response?.data || error;
  }
};
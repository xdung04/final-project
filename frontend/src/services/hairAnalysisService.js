import * as request from "~/apis/configs/httpRequest";
 
// Lưu kết quả phân tích
export const saveAnalysis = async (payload) => {
  try {
    const res = await request.post("/hair-analysis/save", payload);
    return res;
  } catch (error) {
    console.error("Lỗi saveAnalysis:", error);
    throw error.response?.data || error;
  }
};
 
// Đánh giá kết quả phân tích
export const rateAnalysis = async (idAnalysis, payload) => {
  try {
    const res = await request.patch(`/hair-analysis/${idAnalysis}/rate`, payload);
    return res;
  } catch (error) {
    console.error("Lỗi rateAnalysis:", error);
    throw error.response?.data || error;
  }
};
 
// Lấy lịch sử phân tích
export const getMyHistory = async () => {
  try {
    const res = await request.get("/hair-analysis/my-history");
    return res;
  } catch (error) {
    console.error("Lỗi getMyHistory:", error);
    throw error.response?.data || error;
  }
};

// Thử kiểu tóc (Try-on)
export const tryOn = async (formData) => {
  try {
    const res = await request.post("/hair-analysis/try-on", formData, {
      headers: {
        "Content-Type": undefined, 
      },
    });
    return res;
  } catch (error) {
    console.error("Lỗi tryOn:", error);
    throw error.response?.data || error;
  }
};
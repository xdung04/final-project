import * as request from "~/apis/configs/httpRequest";

// Lấy thông tin user hiện tại.
// Không còn cần truyền token để tự gắn Authorization header — cookie httpOnly
// tự động gửi kèm nhờ withCredentials: true đã cấu hình ở httpRequest.js.
export const getProfile = async () => {
  try {
    const res = await request.get("/user/profile");
    console.log("API getProfile trả về:", res);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateProfile = async (data) => {
  try {
    const res = await request.put("/user/profile", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: [(formData) => formData], // ⚡ axios không stringify FormData
    });
    console.log("API updateProfile trả về:", res);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ====== Update phone riêng ======
export const updatePhone = async (phoneNumber) => {
  try {
    const res = await request.put("/user/profile/phone", { phoneNumber });
    console.log("API updatePhone trả về:", res);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const changePassword = async (data) => {
  try {
    const res = await request.put("/user/profile/change-password", data);
    console.log("API changePassword trả về:", res);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};
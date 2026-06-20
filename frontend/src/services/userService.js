import * as request from "~/apis/configs/httpRequest";

// Lấy thông tin user hiện tại
export const getProfile = async (token) => {
  try {
    const res = await request.get("/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("API getProfile trả về:", res);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const updateProfile = async (token, data) => {
  try {
    const res = await request.put("/user/profile", data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      transformRequest: [(formData) => formData], // ⚡ Thêm dòng này để axios không stringify FormData
    });
    console.log("API updateProfile trả về:", res);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};
// ====== Update phone riêng ======
export const updatePhone = async (token, phoneNumber) => {
  try {
    const res = await request.put(
      "/user/profile/phone",
      { phoneNumber },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("API updatePhone trả về:", res);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const changePassword = async (
  token,
  data
) => {
  try {
    const res = await request.put(
      "/user/profile/change-password",
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "API changePassword trả về:",
      res
    );

    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};
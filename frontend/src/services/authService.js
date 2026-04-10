import * as request from "~/apis/configs/httpRequest"; // file này export các hàm post

// Đăng nhập
export const login = async ({ email, password }) => {
  try {
    const res = await request.post("/auth/login", { email, password });
    console.log("API login trả về:", res);
    return res;
  } catch (error) {
    throw error;
  }
};

// Google Login
export const googleLogin = async ({ token }) => {
  try {
    const res = await request.post("/auth/google", { token });
    return res;
  } catch (error) {
    throw error;
  }
};

// Gửi OTP khi đăng ký
export const register = async ({
  fullName,
  email,
  phoneNumber,
  password,
  confirmPassword,
}) => {
  try {
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      throw new Error("Vui lòng điền đầy đủ thông tin");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Email không hợp lệ");

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber))
      throw new Error("Số điện thoại không hợp lệ");

    if (password !== confirmPassword)
      throw new Error("Mật khẩu và xác nhận mật khẩu không khớp");

    const payload = { fullName, email, phoneNumber, password };
    console.log("Register payload gửi xuống backend:", payload);

    const res = await request.post("/auth/register", payload);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API register:",
      error.response?.data || error.message,
    );
    const message = error.response?.data?.error || error.message;
    throw message;
  }
};

// Xác thực OTP
export const verifyOtp = async ({ email, otp }) => {
  try {
    const res = await request.post("/auth/verify-otp", { email, otp });
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Quên mật khẩu
export const forgotPassword = async ({ email }) => {
  try {
    const res = await request.post("/auth/forgot-password", { email });
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyForgotOtp = async ({ email, otp }) => {
  try {
    const res = await request.post("/auth/verify-forgot-otp", { email, otp });
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetPassword = async ({ email, newPassword }) => {
  try {
    const res = await request.post("/auth/reset-password", {
      email,
      newPassword,
    });
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const refreshToken = async ({ refreshToken }) => {
  try {
    const res = await request.post("/auth/refresh", { refreshToken });
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logout = async ({ refreshToken }) => {
  try {
    const res = await request.post("/auth/logout", { refreshToken });
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

import * as request from "~/apis/configs/httpRequest";

// Đăng nhập
export const login = async ({ email, password }) => {
  try {
    const res = await request.post("/auth/login", { email, password });
    return res;
  } catch (error) {
    throw error; // ✅ Giữ nguyên để interceptor xử lý
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

// Đăng ký
export const register = async ({ fullName, email, phoneNumber, password, confirmPassword }) => {
  try {
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      throw new Error("Vui lòng điền đầy đủ thông tin");
    }
    const payload = { fullName, email, phoneNumber, password };
    const res = await request.post("/auth/register", payload);
    return res;
  } catch (error) {
    throw error;
  }
};

// Xác thực OTP
export const verifyOtp = async ({ email, otp }) => {
  try {
    const res = await request.post("/auth/verify-otp", { email, otp });
    return res;
  } catch (error) {
    throw error;
  }
};

// Quên mật khẩu
export const forgotPassword = async ({ email }) => {
  try {
    const res = await request.post("/auth/forgot-password", { email });
    return res;
  } catch (error) {
    throw error;
  }
};

export const verifyForgotOtp = async ({ email, otp }) => {
  try {
    const res = await request.post("/auth/verify-forgot-otp", { email, otp });
    return res;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async ({ email, newPassword }) => {
  try {
    const res = await request.post("/auth/reset-password", { email, newPassword });
    return res;
  } catch (error) {
    throw error;
  }
};

// Không còn cần nhận refreshToken làm tham số — cookie (httpOnly) tự động được
// gửi kèm request nhờ withCredentials: true đã cấu hình ở httpRequest.js.
// Body gửi rỗng {} để giữ nguyên method POST, không phải đổi route bên BE.
export const refreshToken = async () => {
  try {
    const res = await request.post("/auth/refresh", {});
    return res;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const res = await request.post("/auth/logout", {});
    return res;
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin user (verify token)
export const getMe = async () => {
  try {
    const res = await request.get("/auth/me");
    return res;
  } catch (error) {
    throw error;
  }
};
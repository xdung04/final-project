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
    throw error; // ✅ Giữ nguyên
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
    throw error; // ✅ Giữ nguyên
  }
};

// Xác thực OTP
export const verifyOtp = async ({ email, otp }) => {
  try {
    const res = await request.post("/auth/verify-otp", { email, otp });
    return res;
  } catch (error) {
    throw error; // ✅ ĐÃ SỬA: Không bóc tách bậy bạ ở đây nữa
  }
};

// Quên mật khẩu
export const forgotPassword = async ({ email }) => {
  try {
    const res = await request.post("/auth/forgot-password", { email });
    return res;
  } catch (error) {
    throw error; // ✅ ĐÃ SỬA
  }
};

export const verifyForgotOtp = async ({ email, otp }) => {
  try {
    const res = await request.post("/auth/verify-forgot-otp", { email, otp });
    return res;
  } catch (error) {
    throw error; // ✅ ĐÃ SỬA
  }
};

export const resetPassword = async ({ email, newPassword }) => {
  try {
    const res = await request.post("/auth/reset-password", { email, newPassword });
    return res;
  } catch (error) {
    throw error; // ✅ ĐÃ SỬA
  }
};

export const refreshToken = async ({ refreshToken }) => {
  try {
    const res = await request.post("/auth/refresh", { refreshToken });
    return res;
  } catch (error) {
    throw error; // ✅ ĐÃ SỬA
  }
};

export const logout = async ({ refreshToken }) => {
  try {
    const res = await request.post("/auth/logout", { refreshToken });
    return res;
  } catch (error) {
    throw error; // ✅ ĐÃ SỬA
  }
};

// Lấy thông tin user (verify token)
export const getMe = async () => {
  try {
    const res = await request.get("/auth/me");
    return res; // Trả về res (Đã được file httpRequest cấu bóc tách sẵn .data nếu chạy thành công)
  } catch (error) {
    throw error; // ✅ ĐÃ SỬA THÀNH CÔNG: Trả nguyên bản lỗi Axios về cho Interceptor xử lý 401
  }
};
import AuthService from "../services/authService.js";

const COOKIE_OPTIONS_ACCESS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000,
};

const COOKIE_OPTIONS_REFRESH = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    res.cookie("accessToken", result.accessToken, COOKIE_OPTIONS_ACCESS);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS_REFRESH);

    // ✅ Tách token ra, không trả về FE
    const { accessToken, refreshToken, ...safeResult } = result;
    res.json({ message: "Đăng nhập thành công", ...safeResult });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi server" });
  }
};

// Refresh token — giữ nguyên
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await AuthService.refresh(refreshToken);

    res.cookie("accessToken", result.accessToken, COOKIE_OPTIONS_ACCESS);

    return res.json(result);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({
      message: err.message || "Lỗi xác thực hệ thống",
    });
  }
};

// Logout — giữ nguyên
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await AuthService.logout(refreshToken);

    res.clearCookie("accessToken", COOKIE_OPTIONS_ACCESS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS_REFRESH);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi server" });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await AuthService.googleLogin(token);

    res.cookie("accessToken", result.accessToken, COOKIE_OPTIONS_ACCESS);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS_REFRESH);

    // ✅ Tách token ra, không trả về FE
    const { accessToken, refreshToken, ...safeResult } = result;
    res.json({ message: "Đăng nhập Google thành công", ...safeResult });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || "Lỗi server",
    });
  }
};

// getMe — giữ nguyên
const getMe = async (req, res) => {
  try {
    const idUser = req.user.idUser;
    const user = await AuthService.getMe(idUser);
    return res.status(200).json({ message: "Lấy thông tin user thành công", user });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Lỗi server" });
  }
};

export default { login, refresh, logout, googleLogin, getMe };
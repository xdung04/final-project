import AuthService from "../services/authService.js";

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({ message: "Đăng nhập thành công", ...result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi server" });
  }
};

// Refresh token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refresh(refreshToken);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi server" });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.logout(refreshToken);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi server" });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body; // token từ frontend (Google)

    const result = await AuthService.googleLogin(token);

    res.json({
      message: "Đăng nhập Google thành công",
      ...result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || "Lỗi server",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const idUser = req.user.idUser;

    const user = await AuthService.getMe(idUser);

    return res.status(200).json({
      message: "Lấy thông tin user thành công",
      user,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Lỗi server",
    });
  }
};

// Export tất cả thành 1 object
export default {
  login,
  refresh,
  logout,
  googleLogin,
  getMe,
};

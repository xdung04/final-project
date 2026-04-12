// controllers/userController.js
import * as userService from "../services/userService.js";

const register = async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    const result = await userService.sendOtpForRegister(req.body);
    console.log(`OTP đã gửi đến ${req.body.email}`);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi register:", err.message);
    const status = err.status || 400;
    return res.status(status).json({ 
      error: err.message,
      isGoogleAccount: !!err.isGoogleAccount 
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const newUser = await userService.verifyOtpAndCreateUser(email, otp);
    return res.status(201).json({ 
      message: "Đăng ký thành công", 
      user: newUser 
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;
    console.log("BODY RECEIVED:", req.body);
    const newUser = await userService.createUserService(fullName, phoneNumber);
    return res.status(201).json({
      success: true,
      message: "Tạo khách hàng thành công",
      idCustomer: newUser.idUser,
      fullName: newUser.fullName,
      phoneNumber: newUser.phoneNumber,
    });
  } catch (error) {
    console.error("Lỗi tạo user:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Lỗi server",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await userService.sendOtpForForgotPassword(email);
    return res.status(200).json({ message: "OTP đã gửi, vui lòng xác nhận" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    await userService.verifyOtpForForgotPassword(email, otp);
    return res.status(200).json({ message: "OTP xác thực thành công, bạn có thể đặt lại mật khẩu" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    await userService.resetPassword(email, newPassword);
    return res.status(200).json({ message: "Mật khẩu đã được cập nhật" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export default {
  register,
  verifyOtp,
  createUser,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
};
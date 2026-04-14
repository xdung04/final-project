// controllers/userController.js
import * as userService from "../services/userService.js";

const register = async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    const result = await userService.sendOtpForRegister(req.body);
    
    return res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi register:", err.message);
    
    const status = err.status || 400;
    return res.status(status).json({ 
      message: err.message,           // ← Thay 'error' thành 'message' cho đồng nhất
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
    console.error("Lỗi verifyOtp:", err.message);
    
    const status = err.status || 400;
    return res.status(status).json({ 
      message: err.message 
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;
    const newUser = await userService.createUserService(fullName, phoneNumber);
    
    return res.status(201).json({
      success: true,
      message: "Tạo khách hàng thành công",
      idCustomer: newUser.idUser,
      fullName: newUser.fullName,
      phoneNumber: newUser.phoneNumber,
    });
  } catch (error) {
    console.error("Lỗi createUser:", error.message);
    
    const status = error.status || 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi server",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await userService.sendOtpForForgotPassword(email);
    
    return res.status(200).json({ 
      message: "OTP đã gửi, vui lòng xác nhận" 
    });
  } catch (err) {
    console.error("Lỗi forgotPassword:", err.message);
    
    const status = err.status || 400;
    return res.status(status).json({ 
      message: err.message 
    });
  }
};

const verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    await userService.verifyOtpForForgotPassword(email, otp);
    
    return res.status(200).json({ 
      message: "OTP xác thực thành công, bạn có thể đặt lại mật khẩu" 
    });
  } catch (err) {
    console.error("Lỗi verifyForgotOtp:", err.message);
    
    const status = err.status || 400;
    return res.status(status).json({ 
      message: err.message 
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    await userService.resetPassword(email, newPassword);
    
    return res.status(200).json({ 
      message: "Mật khẩu đã được cập nhật" 
    });
  } catch (err) {
    console.error("Lỗi resetPassword:", err.message);
    
    const status = err.status || 400;
    return res.status(status).json({ 
      message: err.message 
    });
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
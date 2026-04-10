// services/userService.js
import bcrypt from "bcryptjs";
import db from "../models/index.js";
import { sendOtpEmail } from "./mailService.js";

const salt = bcrypt.genSaltSync(10);
const otpStore = {}; // In-memory OTP store (key = email)

// Hash password
async function hashUserPassword(password) {
  return bcrypt.hash(password, salt);
}

// Helper: Tạo Customer nếu chưa tồn tại
async function createCustomerIfNotExists(userId, transaction = null) {
  const existingCustomer = await db.Customer.findOne({
    where: { idCustomer: userId },
    transaction,
  });

  if (!existingCustomer) {
    await db.Customer.create(
      { 
        idCustomer: userId,
        loyaltyPoint: 0,
        address: null 
      },
      { transaction }
    );
  }
}

// ==================== REGISTER OTP ====================
export async function sendOtpForRegister(data) {
  const { email, password, fullName, phoneNumber } = data;

  let errorMessage = null;

  if (!email || !password || !fullName || !phoneNumber) {
    errorMessage = "Thiếu thông tin bắt buộc (email, password, fullName, phoneNumber)";
  }

  const existingUser = await db.User.findOne({ where: { email } });

  if (existingUser) {
    if (existingUser.googleId && !existingUser.password) {
      // Trả về response bình thường thay vì throw lỗi
      return {
        success: false,
        isGoogleAccount: true,
        message: "Email này đã đăng nhập bằng Google. Bạn có muốn thiết lập mật khẩu không?"
      };
    }

    // Email đã tồn tại bình thường
    throw new Error("Email đã tồn tại trong hệ thống");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    user: { email, password, fullName, phoneNumber, role: "customer" },
    purpose: "register",
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    throw new Error("Không thể gửi OTP, vui lòng thử lại");
  }

  return { message: "OTP đã được gửi tới email của bạn" };
}

// Xác thực OTP và tạo User + Customer
export async function verifyOtpAndCreateUser(email, otp) {
  const record = otpStore[email];
  if (!record || record.purpose !== "register") {
    throw new Error("OTP hết hạn hoặc không tồn tại");
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    throw new Error("OTP đã hết hạn");
  }
  if (otp !== record.otp) {
    throw new Error("OTP không chính xác");
  }

  const t = await db.sequelize.transaction();

  try {
    let user = await db.User.findOne({
      where: { email: record.user.email },
      transaction: t,
    });

    if (user) {
      // Case: Email Google đã tồn tại → thiết lập password
      if (user.googleId && !user.password) {
        user.password = await hashUserPassword(record.user.password);
        user.fullName = record.user.fullName || user.fullName;
        user.phoneNumber = record.user.phoneNumber || user.phoneNumber;
        user.isStatus = true;
        await user.save({ transaction: t });
      }
    } else {
      // Tạo user mới
      user = await db.User.create(
        {
          ...record.user,
          password: await hashUserPassword(record.user.password),
          isStatus: true,
          authProvider: "local",
        },
        { transaction: t }
      );
    }

    // Tạo Customer nếu chưa có
    await createCustomerIfNotExists(user.idUser, t);

    await t.commit();
    delete otpStore[email];
    return user;
  } catch (error) {
    await t.rollback();
    console.error("Lỗi verifyOtpAndCreateUser:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new Error("Email hoặc số điện thoại đã tồn tại");
    }
    throw new Error("Không thể tạo tài khoản, vui lòng thử lại");
  }
}

// ==================== CREATE USER NHANH (không OTP) ====================
export async function createUserService(fullName, phoneNumber) {
  if (!fullName || !phoneNumber) {
    throw new Error("Vui lòng cung cấp họ tên và số điện thoại");
  }

  const existingUser = await db.User.findOne({ where: { phoneNumber } });
  if (existingUser) {
    throw new Error("Số điện thoại đã được sử dụng");
  }

  const t = await db.sequelize.transaction();

  try {
    const newUser = await db.User.create({
      fullName,
      phoneNumber,
      password: null,
      role: "customer",
      isStatus: false,
      email: null,
      authProvider: "local",
    }, { transaction: t });

    await createCustomerIfNotExists(newUser.idUser, t);

    await t.commit();
    return newUser;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

// ==================== FORGOT PASSWORD ====================
export async function sendOtpForForgotPassword(email) {
  const user = await db.User.findOne({ where: { email } });

  if (!user) throw new Error("Email không tồn tại");

  // 🔥 CASE GOOGLE
  if (user.googleId && !user.password) {
    console.log("User Google đang thiết lập password lần đầu");
  }

  // 🔥 CASE LOCAL
  if (!user.googleId && !user.password) {
    throw new Error("Tài khoản không hợp lệ");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    purpose: "forgotPassword",
    expiresAt: Date.now() + 5 * 60 * 1000,
    isSetPassword: user.googleId && !user.password, // 🔥 KEY
  };

  await sendOtpEmail(email, otp);

  return {
    message: user.googleId && !user.password
      ? "OTP để thiết lập mật khẩu đã gửi"
      : "OTP đã gửi để đặt lại mật khẩu",
  };
}

export async function verifyOtpForForgotPassword(email, otp) {
  const record = otpStore[email];
  if (!record || record.purpose !== "forgotPassword") {
    throw new Error("OTP không hợp lệ hoặc đã hết hạn");
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    throw new Error("OTP đã hết hạn");
  }
  if (otp !== record.otp) {
    throw new Error("OTP không chính xác");
  }

  record.verified = true;
  return { message: "OTP chính xác, bạn có thể đặt lại mật khẩu" };
}

export async function resetPassword(email, newPassword) {
  const record = otpStore[email];

  if (!record || !record.verified) {
    throw new Error("Bạn chưa xác thực OTP");
  }

  const user = await db.User.findOne({ where: { email } });

  const hashPassword = await hashUserPassword(newPassword);

  await user.update({
    password: hashPassword,
    authProvider: user.googleId ? "hybrid" : "local", // 🔥 update
  });

  delete otpStore[email];

  return {
    message: record.isSetPassword
      ? "Thiết lập mật khẩu thành công"
      : "Đổi mật khẩu thành công",
  };
}

export default {
  sendOtpForRegister,
  verifyOtpAndCreateUser,
  createUserService,
  sendOtpForForgotPassword,
  verifyOtpForForgotPassword,
  resetPassword,
};
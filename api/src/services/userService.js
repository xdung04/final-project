// services/userService.js
import bcrypt from "bcryptjs";
import db from "../models/index.js";
import { sendOtpEmail } from "./mailService.js";
import VoucherService from "./voucherService.js";

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
        address: null,
      },
      { transaction },
    );
  }
}

// Kiểm tra tài khoản do admin tạo theo phoneNumber
async function getAdminCreatedAccount(phoneNumber, transaction = null) {
  if (!phoneNumber) return null;

  return await db.User.findOne({
    where: {
      phoneNumber,
      isStatus: false, // Tài khoản admin tạo
      email: null, // Chưa có email
      password: null, // Chưa có password
      googleId: null, // Chưa có Google
    },
    transaction,
  });
}

// ==================== REGISTER OTP ====================
// ==================== REGISTER OTP ====================
export async function sendOtpForRegister(data) {
  const { email, password, fullName, phoneNumber } = data;

  // Kiểm tra thông tin bắt buộc
  if (!email || !password || !fullName || !phoneNumber) {
    throw {
      status: 400,
      message:
        "Vui lòng nhập đầy đủ thông tin (họ tên, email, số điện thoại, mật khẩu)",
    };
  }

  // Kiểm tra định dạng số điện thoại
  if (!/^0[0-9]{9}$/.test(phoneNumber)) {
    throw {
      status: 400,
      message:
        "Số điện thoại phải là 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0912345678)",
    };
  }

  // Kiểm tra email đã tồn tại
  const existingUserByEmail = await db.User.findOne({ where: { email } });

  if (existingUserByEmail) {
    if (existingUserByEmail.googleId && !existingUserByEmail.password) {
      return {
        success: false,
        isGoogleAccount: true,
        message:
          "Email này đã đăng nhập bằng Google. Bạn có muốn thiết lập mật khẩu không?",
      };
    }
    throw { status: 409, message: "Email đã tồn tại trong hệ thống" };
  }

  // Kiểm tra số điện thoại đã được sử dụng bởi tài khoản active
  const existingPhoneUser = await db.User.findOne({
    where: {
      phoneNumber,
      isStatus: true,
    },
  });

  if (existingPhoneUser) {
    throw {
      status: 409,
      message: "Số điện thoại này đã được sử dụng bởi một tài khoản khác.",
    };
  }

  // Tạo OTP và lưu tạm
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
    throw { status: 500, message: "Không thể gửi OTP, vui lòng thử lại sau" };
  }

  return { message: "Mã OTP đã được gửi tới email của bạn" };
}
// Xác thực OTP và tạo User + Customer
export async function verifyOtpAndCreateUser(email, otp) {
  const record = otpStore[email];
  if (!record || record.purpose !== "register") {
    throw { status: 400, message: "OTP hết hạn hoặc không tồn tại" };
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    throw { status: 400, message: "OTP đã hết hạn" };
  }
  if (otp !== record.otp) {
    throw { status: 400, message: "OTP không chính xác" };
  }

  const t = await db.sequelize.transaction();

  try {
    let user;

    const adminAccount = await getAdminCreatedAccount(record.user.phoneNumber, t);

    if (adminAccount) {
      user = adminAccount;
      user.email = record.user.email;
      user.password = await hashUserPassword(record.user.password);
      user.fullName = record.user.fullName || user.fullName;
      user.phoneNumber = record.user.phoneNumber;
      user.isStatus = true;
      user.authProvider = "local";

      await user.save({ transaction: t });
      console.log(`✅ Kích hoạt tài khoản admin-created ${user.idUser} với email ${email}`);
    } else {
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

    await createCustomerIfNotExists(user.idUser, t);

    await t.commit();
    try {
      await VoucherService.issueNewCustomerVoucher(user.idUser);
    } catch (err) {
      console.error("Lỗi khi tặng voucher new customer:", err);
    }
    delete otpStore[email];
    return user;
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Lỗi verifyOtpAndCreateUser:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw { status: 409, message: "Email hoặc số điện thoại đã tồn tại" };
    }

    throw { status: 500, message: "Không thể tạo tài khoản, vui lòng thử lại" };
  }
}

export async function createUserService(fullName, phoneNumber) {
  if (!fullName || !phoneNumber) {
    throw new Error("Vui lòng cung cấp họ tên và số điện thoại");
  }

  if (!/^0[0-9]{9}$/.test(phoneNumber)) {
    throw new Error("Số điện thoại không hợp lệ");
  }

  const existingUser = await db.User.findOne({ where: { phoneNumber } });
  if (existingUser) {
    throw new Error("Số điện thoại đã được sử dụng");
  }

  const t = await db.sequelize.transaction();

  try {
    const newUser = await db.User.create(
      {
        fullName,
        phoneNumber,
        password: null,
        role: "customer",
        isStatus: false,
        email: null,
        authProvider: "local",
      },
      { transaction: t },
    );

    await createCustomerIfNotExists(newUser.idUser, t);

    await t.commit();
    return newUser;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

export async function sendOtpForForgotPassword(email) {
  const user = await db.User.findOne({ where: { email } });

  if (!user) throw new Error("Email không tồn tại");

  if (user.role !== "customer") {
    throw new Error("Tài khoản không có quyền thực hiện chức năng này");
  }

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
    message:
      user.googleId && !user.password
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

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import redisClient from "../config/redis.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==================== HELPER ====================
async function ensureCustomer(userId, transaction = null) {
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
      { transaction }
    );
  }
}

/**
 * Helper tìm idBranch dựa vào vai trò của User
 */
async function getBranchIdByUser(user) {
  if (user.role === "receptionist") {
    const receptionist = await db.Receptionist.findOne({ where: { idReceptionist: user.idUser } });
    return receptionist ? receptionist.idBranch : null;
  }
  if (user.role === "barber") {
    const barber = await db.Barber.findOne({ where: { idBarber: user.idUser } });
    return barber ? barber.idBranch : null;
  }
  return null;
}

// ==================== LOGIN ====================
export async function login(email, password) {
  if (!email || !password) {
    throw { status: 400, message: "Email và password là bắt buộc." };
  }

  const user = await db.User.findOne({ where: { email } });
  if (!user) throw { status: 401, message: "Email hoặc mật khẩu không đúng." };

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw { status: 401, message: "Email hoặc mật khẩu không đúng." };

  // Kiểm tra barber bị khóa
  if (user.role === "barber") {
    const barber = await db.Barber.findOne({ where: { idBarber: user.idUser } });
    if (barber && Number(barber.isLocked) === 1) {
      throw {
        status: 403,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý.",
      };
    }
  }

  if (user.role === "customer") {
    await ensureCustomer(user.idUser);
  }

  const needPhone = !user.phoneNumber;

  // 🌟 NÂNG CẤP BẢO MẬT: Lấy idBranch đính kèm vào Token
  const idBranch = await getBranchIdByUser(user);

  const payload = { 
    idUser: user.idUser, 
    email: user.email, 
    role: user.role,
    idBranch: idBranch // Đưa vào payload của cả cặp token
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

  await redisClient.set(`refresh:${user.idUser}`, refreshToken, "EX", 7 * 24 * 60 * 60);

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user: {
      idUser: user.idUser,
      fullName: user.fullName,
      email: user.email,
      image: user.image || null,
      role: user.role,
      phoneNumber: user.phoneNumber,
      idBranch: idBranch // Trả về cho Frontend lưu Context
    },
    needPhone,
  };
}

// ==================== REFRESH TOKEN ====================
export async function refresh(refreshToken) {
  if (!refreshToken) throw { status: 401, message: "NO_REFRESH_TOKEN" };

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const savedToken = await redisClient.get(`refresh:${decoded.idUser}`);

    if (!savedToken || savedToken !== refreshToken) {
      throw { status: 403, message: "INVALID_REFRESH_TOKEN" };
    }

    // 🌟 ĐỒNG BỘ: Giữ nguyên thông tin idBranch khi tạo Access Token mới
    const newAccessToken = jwt.sign(
      { 
        idUser: decoded.idUser, 
        email: decoded.email, 
        role: decoded.role,
        idBranch: decoded.idBranch || null 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { accessToken: newAccessToken, expiresIn: 3600, role: decoded.role };
  } catch (err) {
    throw { status: 403, message: "INVALID_REFRESH_TOKEN" };
  }
}

// ==================== LOGOUT ====================
export async function logout(refreshToken) {
  if (!refreshToken) throw { status: 400, message: "No refresh token provided" };

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    await redisClient.del(`refresh:${decoded.idUser}`);
    return { message: "Logout thành công" };
  } catch (err) {
    throw { status: 400, message: "Invalid refresh token" };
  }
}

// ==================== GOOGLE LOGIN ====================
export async function googleLogin(googleToken) {
  if (!googleToken) {
    throw { status: 400, message: "Google token is required" };
  }

  const ticket = await client.verifyIdToken({
    idToken: googleToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name;
  const avatar = payload.picture;

  let user = await db.User.findOne({ where: { email } });
  let isNewUser = false;
  let isLinked = false;
  let needPhone = false;

  if (!user) {
    user = await db.User.create({
      email,
      fullName: name,
      image: avatar,
      googleId,
      authProvider: "google",
      role: "customer",
      password: null,
      phoneNumber: null,
      isStatus: true,
    });
    isNewUser = true;
    needPhone = true;
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.authProvider = user.authProvider === "local" ? "hybrid" : user.authProvider;
    await user.save();
    isLinked = true;
  }

  if (!user.phoneNumber) {
    needPhone = true;
  }

  if (user.role === "customer") {
    await ensureCustomer(user.idUser);
  }

  if (user.role === "barber") {
    const barber = await db.Barber.findOne({ where: { idBarber: user.idUser } });
    if (barber && Number(barber.isLocked) === 1) {
      throw { status: 403, message: "Tài khoản của bạn đã bị khóa." };
    }
  }

  // 🌟 NÂNG CẤP BẢO MẬT: Đính kèm idBranch cho tài khoản Google (Nếu phân quyền)
  const idBranch = await getBranchIdByUser(user);

  const tokenPayload = { 
    idUser: user.idUser, 
    email: user.email, 
    role: user.role,
    idBranch: idBranch
  };

  const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

  await redisClient.set(`refresh:${user.idUser}`, refreshToken, "EX", 7 * 24 * 60 * 60);

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user: {
      idUser: user.idUser,
      fullName: user.fullName,
      email: user.email,
      image: user.image,
      role: user.role,
      phoneNumber: user.phoneNumber,
      idBranch: idBranch
    },
    isNewUser,
    isLinked,
    needPhone,
  };
}

// ==================== GET ME ====================
export async function getMe(idUser) {
  const user = await db.User.findByPk(idUser, {
    attributes: ["idUser", "email", "role", "fullName", "image", "phoneNumber"],
  });

  if (!user) {
    const error = new Error("User không tồn tại");
    error.status = 401;
    throw error;
  }

  // 🌟 ĐỒNG BỘ FRONTEND: Trả thêm dữ liệu idBranch về cho Client Context đồng nhất số liệu
  const idBranch = await getBranchIdByUser(user);
  
  return {
    idUser: user.idUser,
    fullName: user.fullName,
    email: user.email,
    image: user.image,
    role: user.role,
    phoneNumber: user.phoneNumber,
    idBranch: idBranch
  };
}

export default {
  login,
  refresh,
  logout,
  getMe,
  googleLogin,
};
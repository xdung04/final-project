// services/authService.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import redisClient from "../config/redis.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    const Barber = db.Barber;
    const barber = await Barber.findOne({ where: { idBarber: user.idUser } });
    if (barber && Number(barber.isLocked) === 1) {
      throw {
        status: 403,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý để mở lại.",
      };
    }
  }

  const payload = { idUser: user.idUser, email: user.email, role: user.role };

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
    },
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

    const newAccessToken = jwt.sign(
      { idUser: decoded.idUser, email: decoded.email, role: decoded.role },
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
    // CASE 1: Tạo user mới từ Google
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
  } 
  else if (!user.googleId) {
    // CASE 2: Liên kết Google với tài khoản local đã tồn tại
    user.googleId = googleId;
    user.authProvider = user.authProvider === "local" ? "hybrid" : user.authProvider;
    await user.save();
    isLinked = true;
  }

  // Nếu chưa có số điện thoại thì cần bổ sung
  if (!user.phoneNumber) {
    needPhone = true;
  }

  // Kiểm tra barber bị khóa
  if (user.role === "barber") {
    const barber = await db.Barber.findOne({ where: { idBarber: user.idUser } });
    if (barber && Number(barber.isLocked) === 1) {
      throw { status: 403, message: "Tài khoản của bạn đã bị khóa." };
    }
  }

  const tokenPayload = { idUser: user.idUser, email: user.email, role: user.role };

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
    },
    isNewUser,
    isLinked,
    needPhone,
  };
}

export default {
  login,
  refresh,
  logout,
  googleLogin,
};
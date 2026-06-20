import jwt from "jsonwebtoken";

/**
 * Helper: lấy token ưu tiên từ cookie trước, fallback header (giai đoạn chuyển tiếp)
 */
const extractToken = (req) => {
  // 1. Ưu tiên đọc từ cookie (cách mới)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  // 2. Fallback header Authorization (cách cũ, giữ tạm cho code FE chưa sửa hết)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
};

/**
 * Middleware Xác thực người dùng qua JWT (Strict Mode)
 */
export const authenticate = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Yêu cầu xác thực. Không tìm thấy mã truy cập (Token).",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      idUser: decoded.idUser,
      email: decoded.email,
      role: decoded.role,
      idBranch: decoded.idBranch || null,
    };

    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Mã truy cập đã hết hạn." : "Mã truy cập không hợp lệ.";
    return res.status(401).json({ success: false, message });
  }
};

/**
 * Middleware Phân quyền theo vai trò (RBAC)
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Cảnh báo bảo mật: Bạn không có quyền thực hiện hành động này.",
      });
    }
    next();
  };
};

/**
 * Middleware Xác thực không bắt buộc (Cho các tính năng Public/Guest)
 */
export const optionalAuthenticate = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      idUser: decoded.idUser,
      email: decoded.email,
      role: decoded.role,
      idBranch: decoded.idBranch || null,
    };
    next();
  } catch (err) {
    req.user = undefined;
    next();
  }
};
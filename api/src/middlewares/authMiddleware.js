import jwt from "jsonwebtoken";

/**
 * Middleware Xác thực người dùng qua JWT (Strict Mode)
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false,
      message: "Yêu cầu xác thực. Không tìm thấy mã truy cập (Token)." 
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Xác thực chữ ký mã hóa mã thông báo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gán thông tin an toàn vào req.user (Lấy thẳng idBranch từ Token)
    req.user = {
      idUser: decoded.idUser,
      email: decoded.email,
      role: decoded.role,
      idBranch: decoded.idBranch || null // 🌟 Rất quan trọng cho việc phân quyền chi nhánh
    };

    next();
  } catch (err) {
    const message = err.name === "TokenExpiredError" ? "Mã truy cập đã hết hạn." : "Mã truy cập không hợp lệ.";
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
        message: "Cảnh báo bảo mật: Bạn không có quyền thực hiện hành động này." 
      });
    }
    next();
  };
};

/**
 * Middleware Xác thực không bắt buộc (Cho các tính năng Public/Guest)
 */
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = undefined; 
    return next(); 
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      idUser: decoded.idUser,
      email: decoded.email,
      role: decoded.role,
      idBranch: decoded.idBranch || null
    };
    next();
  } catch (err) {
    req.user = undefined; 
    next(); 
  }
};


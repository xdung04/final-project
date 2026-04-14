  import jwt from "jsonwebtoken";

  export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không tìm thấy token." });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token payload:", decoded); 
      req.user = {
        idUser: decoded.idUser, // map id token thành idUser nếu muốn
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }
  };

  // Export authorize luôn
  export const authorize = (roles = []) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Không có quyền truy cập." });
      }
      next();
    };
  }

  export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  // 1. Kiểm tra header:
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Không có token: ĐẶT req.user = undefined và CHUYỂN TIẾP (next())
    req.user = undefined; 
    return next(); 
  }

  // 2. Có token: Tiến hành xác thực
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      idUser: decoded.idUser,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    // ĐẶT req.user = undefined và CHUYỂN TIẾP (next()) để cho phép truy cập Public
    console.warn("Token không hợp lệ, truy cập dưới quyền Public.");
    req.user = undefined; 
    next(); 
  }
};
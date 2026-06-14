import { createContext, useContext, useState, useEffect } from "react";
import { AuthAPI } from "~/apis/AuthAPI";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true); // Giữ ứng dụng ở trạng thái chờ xác thực

  // Load auth từ localStorage khi app khởi chạy
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedUser && storedAccessToken && storedRefreshToken) {
      // 👉 Gọi API verify token xem còn sống hay không
      AuthAPI.getMe()
        .then((res) => {
          // Thành công: Cập nhật toàn bộ data vào state trước
          setUser(JSON.parse(storedUser));
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
        })
        .catch((err) => {
          console.error("Token expired or invalid:", err);
          // ❌ Token chết hoặc có lỗi hệ thống → Dọn sạch rác
          localStorage.clear();
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
        })
        .finally(() => {
          // 🏁 CHỈ TẮT LOADING KHI API ĐÃ CHẠY XONG XUÔI (Thành công hoặc Thất bại đều tắt)
          setLoading(false);
        });
    } else {
      // Nếu không có bất kỳ token nào lưu ở máy, tắt loading luôn để render màn hình khách vãng lai
      setLoading(false);
    }
  }, []);

  // LOGIN
  const login = (userData, newAccessToken, newRefreshToken) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    setUser(userData);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
  };

  // LOGOUT
  const logout = async () => {
    try {
      if (refreshToken) {
        await AuthAPI.logout({ refreshToken }); 
      }
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        logout,
        setUser,
        isLogin: !!user,
        loading, // Expose để các file Router bảo vệ (ProtectedRoute) hoặc Component con bắt trạng thái chờ
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
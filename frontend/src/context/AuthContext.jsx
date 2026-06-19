import { createContext, useContext, useState, useEffect } from "react";
import { AuthAPI } from "~/apis/AuthAPI";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    // Nếu trước đó chưa từng đăng nhập (không có "user" trong localStorage),
    // không cần gọi getMe() làm gì — chắc chắn không có cookie hợp lệ, gọi
    // chỉ tạo ra 401 dư thừa (và 401 đó lại kéo theo logic refresh trong
    // interceptor, gây hàng loạt lỗi 401 lây sang các API khác đang load
    // song song lúc app khởi chạy). Coi như guest luôn, tắt loading ngay.
    if (!storedUser) {
      setLoading(false);
      return;
    }

    // Có dấu hiệu đã từng đăng nhập trước đó -> thử hỏi server xem cookie
    // (accessToken httpOnly) còn hợp lệ hay không.
    AuthAPI.getMe()
      .then((res) => {
        const userData = res?.user || JSON.parse(storedUser);
        setUser(userData);
        setAccessToken(true); // cờ giả, chỉ để code cũ check !accessToken vẫn đúng
        setRefreshToken(true);
      })
      .catch(() => {
        // Cookie hết hạn / không hợp lệ -> dọn sạch, coi như guest
        localStorage.removeItem("user");
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setAccessToken(true);
    setRefreshToken(true);
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      localStorage.removeItem("user");
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
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
import { createContext, useContext, useState, useEffect } from "react";
import { AuthAPI } from "~/apis/AuthAPI";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true); // trạng thái load auth khi app start

  // Load auth từ localStorage khi app khởi chạy
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedUser && storedAccessToken && storedRefreshToken) {
      // 👉 gọi API để verify token còn sống không
      AuthAPI.getMe()
        .then((res) => {
          setUser(JSON.parse(storedUser));
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
        })
        .catch(() => {
          // ❌ token chết → logout luôn
          localStorage.clear();
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
        });
    }

    setLoading(false);
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
        await AuthAPI.logout({ refreshToken }); // gọi API logout nếu có
      }
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      // Xóa localStorage và state
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
        loading, // expose loading để ProtectedRoute chờ load xong
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook tiện lợi
export function useAuth() {
  return useContext(AuthContext);
}

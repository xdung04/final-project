import axios from "axios";

// Tạo instance axios
const request = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Log baseURL để kiểm tra
console.log("Axios baseURL:", request.defaults.baseURL);

// === Interceptor Request: Gắn accessToken ===
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === Interceptor Response: Refresh token ===
request.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;

    // Nếu API lỗi mà không có response -> reject
    if (!error.response) return Promise.reject(error);

    // ❌ 1) Không xử lý refresh nếu là API login / register
    const isAuthAPI =
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register");

    if (isAuthAPI) {
      return Promise.reject(error); // không redirect
    }

    // ❌ 2) Chỉ refresh nếu request có accessToken
    const hasAccessToken = !!localStorage.getItem("accessToken");

    // ❗ Trường hợp token hết hạn -> refresh token
    if (status === 401 && hasAccessToken && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

        const res = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;

        // Lưu token mới
        localStorage.setItem("accessToken", newAccessToken);

        // Gắn token mới vào request cũ và gửi lại
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return request(originalRequest);
      } catch (err) {
        // Refresh fail -> logout
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Điều hướng về trang login
        window.location.href = "/login";
        return;
      }
    }

    // ❌ 3) Nếu không thuộc các case trên → trả lỗi về UI
    return Promise.reject(error);
  }
);

// === Wrapper GET ===
export const get = async (url, options = {}) => {
  const res = await request.get(url, options);
  return res.data;
};

// === Wrapper POST ===
export const post = async (url, data = {}, options = {}) => {
  const res = await request.post(url, data, options);
  return res.data;
};

// === Wrapper PUT ===
export const put = async (url, data = {}, options = {}) => {
  const res = await request.put(url, data, options);
  return res.data;
};

// === Wrapper DELETE ===
export const del = async (url, options = {}) => {
  const res = await request.delete(url, options);
  return res.data;
};

export const patch = async (url, data = {}, options = {}) => {
  const res = await request.patch(url, data, options);
  return res.data;
};

export default request;

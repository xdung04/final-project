import axios from "axios";

// 1. Instance chính của hệ thống
const request = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 2. Instance phụ chuyên dụng để thực hiện cứu hộ (Retry)
const retryInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

console.log("Axios baseURL:", request.defaults.baseURL);

// Quản lý hàng đợi chống Race-Condition
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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

// === Interceptor Response: Cứu hộ 401 ngầm ===
request.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Không xử lý nếu là API login / register
    const isAuthAPI =
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register");

    if (isAuthAPI) {
      return Promise.reject(error);
    }

    const hasAccessToken = !!localStorage.getItem("accessToken");

    if (status === 401 && hasAccessToken && !originalRequest._retry) {
      
      // 1. Nếu chính API refresh cũng bị báo 401 -> Cả 2 token cùng chết hẳn
      if (originalRequest.url.includes("/auth/refresh")) {
        handleLogout(true);
        return new Promise(() => {}); // Nuốt lỗi chót, giữ UI sạch
      }

      // 2. Xử lý hàng đợi cho các API chạy song song đến sau
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            // Kích hoạt cứu hộ bằng thực thể độc lập và lấy thẳng thuộc tính .data ra luôn
            return retryInstance(originalRequest).then(res => res.data); 
          })
          .catch(() => {
            // Nếu có biến cố sập hệ thống, lờ đi để chuẩn bị F5 reload trang
            return new Promise(() => {}); 
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

        // Gọi API refresh bằng axios gốc
        const res = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
        if (!newAccessToken) throw new Error("REFRESH_FAILED_NO_TOKEN");

        console.log(">>> Đổi token ngầm thành công! Token mới:", newAccessToken);
        localStorage.setItem("accessToken", newAccessToken);

        // Giải phóng hàng đợi, kích nổ token mới cho đám đứng chờ
        processQueue(null, newAccessToken);

        // Chạy lại chính request đầu tiên và bóc thẳng .data trả về cho wrapper
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        const retryRes = await retryInstance(originalRequest); 
        return retryRes.data;
        
      } catch (err) {
        processQueue(err, null);
        handleLogout(true); 
        return new Promise(() => {}); 
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Hàm logout dọn dẹp bộ nhớ, đóng cờ và Reload lại trang cho sạch lỗi
const handleLogout = (isExpired = false) => {
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  
  if (isExpired) {
    localStorage.setItem("SESSION_EXPIRED_FLAG", "true");
  }
  window.location.reload();
};

// === Wrapper Các Phương Thức API (Bảo mật tuyệt đối, nuốt trọn reject rò rỉ) ===
export const get = async (url, options = {}) => {
  try {
    const res = await request.get(url, options);
    // Nếu res đã là data (được cứu hộ từ tầng dưới trả lên), lấy luôn res. Ngược lại lấy res.data
    return res && res.config ? res.data : res;
  } catch (err) {
    // Đoạn bọc thép: Nếu đang trong luồng hoán đổi token mà bị lỗi lặt vặt, chặn không cho reject lên UI
    if (isRefreshing) return new Promise(() => {});
    return Promise.reject(err);
  }
};

export const post = async (url, data = {}, options = {}) => {
  try {
    const res = await request.post(url, data, options);
    return res && res.config ? res.data : res;
  } catch (err) {
    if (isRefreshing) return new Promise(() => {});
    return Promise.reject(err);
  }
};

export const put = async (url, data = {}, options = {}) => {
  try {
    const res = await request.put(url, data, options);
    return res && res.config ? res.data : res;
  } catch (err) {
    if (isRefreshing) return new Promise(() => {});
    return Promise.reject(err);
  }
};

export const del = async (url, options = {}) => {
  try {
    const res = await request.delete(url, options);
    return res && res.config ? res.data : res;
  } catch (err) {
    if (isRefreshing) return new Promise(() => {});
    return Promise.reject(err);
  }
};

export const patch = async (url, data = {}, options = {}) => {
  try {
    const res = await request.patch(url, data, options);
    return res && res.config ? res.data : res;
  } catch (err) {
    if (isRefreshing) return new Promise(() => {});
    return Promise.reject(err);
  }
};

export default request;
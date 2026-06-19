import axios from "axios";

// 1. Instance chính của hệ thống
const request = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // BẮT BUỘC để cookie (accessToken/refreshToken) được gửi kèm mỗi request
});

// 2. Instance phụ chuyên dụng để thực hiện cứu hộ (Retry)
const retryInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

console.log("Axios baseURL:", request.defaults.baseURL);

// Quản lý hàng đợi chống Race-Condition
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// === KHÔNG còn interceptor request gắn Authorization thủ công ===
// Cookie httpOnly tự động được browser gửi kèm mỗi request nhờ withCredentials: true.
// Nếu cần fallback cho giai đoạn chuyển tiếp (BE vẫn còn nhận Bearer token cũ ở vài API
// chưa kịp sửa), có thể tạm giữ đoạn dưới, nhưng nên xoá khi đã chắc chắn xong toàn bộ:
//
// request.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

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

    // Trước đây check `hasAccessToken` qua localStorage để quyết định có nên thử refresh
    // hay không. Giờ accessToken là httpOnly cookie, JS không đọc được nữa, nên không thể
    // check kiểu đó. Cứ thấy 401 (và chưa retry) thì thử refresh — nếu thực sự không có
    // cookie hợp lệ, backend sẽ tự trả 401 ở bước refresh và handleLogout sẽ chạy.
    if (status === 401 && !originalRequest._retry) {
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
          .then(() => {
            // Không cần gắn lại Authorization header, cookie mới đã tự có sẵn
            return retryInstance(originalRequest).then((res) => res.data);
          })
          .catch(() => {
            return new Promise(() => {});
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Không cần đọc/gửi refreshToken từ localStorage nữa.
        // Cookie refreshToken (httpOnly) tự động gửi kèm nhờ withCredentials: true.
        await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        console.log(">>> Đổi token ngầm thành công! (cookie đã được BE set mới)");

        // Giải phóng hàng đợi cho các request đang chờ
        processQueue(null);

        // Chạy lại chính request đầu tiên, cookie mới tự gửi kèm
        const retryRes = await retryInstance(originalRequest);
        return retryRes.data;
      } catch (err) {
        processQueue(err);
        handleLogout(true);
        return new Promise(() => {});
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Hàm logout dọn dẹp, đóng cờ và Reload lại trang cho sạch lỗi.
// Không còn xoá accessToken/refreshToken khỏi localStorage vì chúng không còn được
// lưu ở đó nữa — chỉ còn "user" (data hiển thị UI, không nhạy cảm) và cờ SESSION_EXPIRED_FLAG.
// Cookie thật sự được xoá bằng cách gọi API /auth/logout (BE dùng res.clearCookie).
const handleLogout = (isExpired = false) => {
  localStorage.removeItem("user");

  if (isExpired) {
    localStorage.setItem("SESSION_EXPIRED_FLAG", "true");
  }
  window.location.reload();
};

// === Wrapper Các Phương Thức API ===
export const get = async (url, options = {}) => {
  try {
    const res = await request.get(url, options);
    return res && res.config ? res.data : res;
  } catch (err) {
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
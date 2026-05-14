// src/apis/bannerApi.js
import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_BASE_URL + "/banners";

const bannerApi = {
  /**
   * Public - Lấy banner active cho Home
   */
  getActiveBanners: () => axios.get(API_URL),

  /**
   * Admin - Tạo banner mới
   */
  createBanner: (formData, token) =>
    axios.post(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }),
};

export default bannerApi;
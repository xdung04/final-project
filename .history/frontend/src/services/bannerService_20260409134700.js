// src/services/bannerService.js
import bannerApi from "~/apis/bannerApi";

/**
 * Lấy banner active cho Home
 */
export const fetchActiveBanners = async () => {
  try {
    const res = await bannerApi.getActiveBanners();
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Lỗi fetch banner:", error);
    return [];
  }
};

/**
 * Admin upload banner mới
 */
export const uploadBanner = async (formData, token) => {
  try {
    const res = await bannerApi.createBanner(formData, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi upload banner:", error);
    throw error;
  }
};
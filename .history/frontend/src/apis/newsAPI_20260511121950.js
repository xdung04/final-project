// src/apis/newsApi.js
import * as newsService from "~/services/newsService";

export const NewsAPI = {

  // ── PUBLIC ──────────────────────────────────────────────────

  /**
   * Lấy danh sách bài PUBLISHED cho trang khách
   * @param {string|null} category - "NEWS" | "PROMOTION" | "STYLE" | null
   * @returns {Array}
   */
  getPublishedNews: async (category = null) => {
    try {
      const res = await newsService.getPublishedNews(category);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (error) {
      console.error("NewsAPI.getPublishedNews lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết 1 bài theo slug
   * @returns {object|null}
   */
  getNewsBySlug: async (slug) => {
    try {
      const res = await newsService.getNewsBySlug(slug);
      return res.data?.data || null;
    } catch (error) {
      console.error("NewsAPI.getNewsBySlug lỗi:", error);
      throw error;
    }
  },

  // ── ADMIN ────────────────────────────────────────────────────

  /**
   * Admin lấy tất cả bài (kể cả DRAFT)
   * @param {{ category?: string, status?: string }} filters
   * @returns {Array}
   */
  getAllNews: async (filters = {}) => {
    try {
      const res = await newsService.getAllNews(filters);
      return Array.isArray(res?.data) ? res.data : [];
    } catch (error) {
      console.error("NewsAPI.getAllNews lỗi:", error);
      throw error;
    }
  },

  /**
   * Admin tạo bài viết mới
   * @param {object} data - { title, slug, summary, content, category, status, thumbnail }
   */
  createNews: async (data) => {
    try {
      const formData = buildFormData(data);
      const res = await newsService.createNews(formData);
      return res.data;
    } catch (error) {
      console.error("NewsAPI.createNews lỗi:", error);
      throw error;
    }
  },

  /**
   * Admin cập nhật bài viết
   * @param {number} id
   * @param {object} data
   */
  updateNews: async (id, data) => {
    try {
      const formData = buildFormData(data);
      const res = await newsService.updateNews(id, formData);
      return res.data;
    } catch (error) {
      console.error("NewsAPI.updateNews lỗi:", error);
      throw error;
    }
  },

  /**
   * Admin xoá bài viết
   * @param {number} id
   */
  deleteNews: async (id) => {
    try {
      const res = await newsService.deleteNews(id);
      return res.data;
    } catch (error) {
      console.error("NewsAPI.deleteNews lỗi:", error);
      throw error;
    }
  },
};

// ── Helper ────────────────────────────────────────────────────

/**
 * Build FormData từ object
 * - thumbnailFile (File) → upload lên Cloudinary qua backend
 * - thumbnail (string)   → lưu URL thẳng vào DB
 */
function buildFormData(data) {
  const fd = new FormData();

  ["title", "slug", "summary", "content", "category", "status"].forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      fd.append(key, data[key]);
    }
  });

  if (data.thumbnailFile instanceof File) {
    fd.append("thumbnail", data.thumbnailFile);
  } else if (typeof data.thumbnail === "string" && data.thumbnail.trim()) {
    fd.append("thumbnail", data.thumbnail);
  }

  return fd;
}
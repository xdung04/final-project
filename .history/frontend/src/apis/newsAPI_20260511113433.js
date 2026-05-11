// src/apis/newsApi.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/news";

const newsAPI = {
  // ── PUBLIC ────────────────────────────────────────────────

  /**
   * Lấy danh sách bài PUBLISHED cho trang khách
   * @param {string|null} category - "NEWS" | "PROMOTION" | "STYLE" | null
   */
  getPublishedNews: (category = null) =>
    axios.get(API_URL, {
      params: category ? { category } : {},
    }),

  /**
   * Lấy chi tiết 1 bài theo slug
   */
  getNewsBySlug: (slug) => axios.get(`${API_URL}/${slug}`),

  // ── ADMIN ─────────────────────────────────────────────────

  /**
   * Admin lấy tất cả bài (kể cả DRAFT)
   * @param {{ category?: string, status?: string }} filters
   */
  getAllNews: (filters = {}, token) =>
    axios.get(`${API_URL}/admin/all`, {
      params: filters,
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * Admin tạo bài viết mới
   * formData fields: title, slug, summary, content, category, status, thumbnail (file hoặc URL)
   */
  createNews: (formData, token) =>
    axios.post(`${API_URL}/admin`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }),

  /**
   * Admin cập nhật bài viết
   */
  updateNews: (id, formData, token) =>
    axios.put(`${API_URL}/admin/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }),

  /**
   * Admin xoá bài viết
   */
  deleteNews: (id, token) =>
    axios.delete(`${API_URL}/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default newsAPI;
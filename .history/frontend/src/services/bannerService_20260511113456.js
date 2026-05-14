// src/services/newsService.js
import newsApi from "~/apis/newsAPI";

// ── PUBLIC ────────────────────────────────────────────────────

/**
 * Lấy danh sách bài PUBLISHED cho trang khách
 * @param {string|null} category
 * @returns {Array}
 */
export const fetchPublishedNews = async (category = null) => {
  try {
    const res = await newsApi.getPublishedNews(category);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Lỗi fetch tin tức:", error);
    return [];
  }
};

/**
 * Lấy chi tiết 1 bài theo slug
 * @returns {object|null}
 */
export const fetchNewsBySlug = async (slug) => {
  try {
    const res = await newsApi.getNewsBySlug(slug);
    return res.data?.data || null;
  } catch (error) {
    console.error("Lỗi fetch bài viết:", error);
    return null;
  }
};

// ── ADMIN ─────────────────────────────────────────────────────

/**
 * Admin lấy tất cả bài (kể cả DRAFT)
 * @param {{ category?: string, status?: string }} filters
 * @returns {Array}
 */
export const fetchAllNews = async (filters = {}, token) => {
  try {
    const res = await newsApi.getAllNews(filters, token);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Lỗi fetch danh sách (admin):", error);
    return [];
  }
};

/**
 * Admin tạo bài viết mới
 * @param {object} formData - { title, slug, summary, content, category, status, thumbnailFile? }
 */
export const createNews = async (formData, token) => {
  try {
    const payload = buildFormData(formData);
    const res = await newsApi.createNews(payload, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi tạo bài viết:", error);
    throw error;
  }
};

/**
 * Admin cập nhật bài viết
 */
export const updateNews = async (id, formData, token) => {
  try {
    const payload = buildFormData(formData);
    const res = await newsApi.updateNews(id, payload, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi cập nhật bài viết:", error);
    throw error;
  }
};

/**
 * Admin xoá bài viết
 */
export const deleteNews = async (id, token) => {
  try {
    const res = await newsApi.deleteNews(id, token);
    return res.data;
  } catch (error) {
    console.error("Lỗi xoá bài viết:", error);
    throw error;
  }
};

// ── Helper ────────────────────────────────────────────────────

/**
 * Chuyển object form thành FormData để gửi multipart
 * - thumbnailFile (File) → append file → Cloudinary upload
 * - thumbnail (string)   → append URL text → backend lưu thẳng
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
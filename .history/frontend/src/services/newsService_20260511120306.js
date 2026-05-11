// src/services/newsService.js
import * as request from "~/apis/configs/httpRequest";

// ── PUBLIC ────────────────────────────────────────────────────

/**
 * Lấy danh sách bài PUBLISHED cho trang khách
 */
export const getPublishedNews = async (category = null) => {
  try {
    const res = await request.get("/news", {
      params: category ? { category } : {},
    });
    return res;
  } catch (error) {
    console.error("Lỗi getPublishedNews:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

/**
 * Lấy chi tiết 1 bài theo slug
 */
export const getNewsBySlug = async (slug) => {
  try {
    const res = await request.get(`/news/${slug}`);
    return res;
  } catch (error) {
    console.error("Lỗi getNewsBySlug:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

// ── ADMIN ─────────────────────────────────────────────────────

/**
 * Admin lấy tất cả bài (kể cả DRAFT)
 */
export const getAllNews = async (filters = {}) => {
  try {
    const res = await request.get("/news/admin/all", { params: filters });
    return res;
  } catch (error) {
    console.error("Lỗi getAllNews:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

/**
 * Admin tạo bài viết mới
 */
export const createNews = async (formData) => {
  try {
    const res = await request.post("/news/admin", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res;
  } catch (error) {
    console.error("Lỗi createNews:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

/**
 * Admin cập nhật bài viết
 */
export const updateNews = async (id, formData) => {
  try {
    const res = await request.put(`/news/admin/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res;
  } catch (error) {
    console.error("Lỗi updateNews:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

/**
 * Admin xoá bài viết
 */
export const deleteNews = async (id) => {
  try {
    const res = await request.del(`/news/admin/${id}`);
    return res;
  } catch (error) {
    console.error("Lỗi deleteNews:", error.response?.data || error);
    throw error.response?.data || error;
  }
};
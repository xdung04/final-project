// services/newsService.js
import db from "../models/index.js";

const { News } = db;

// ─────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────

/**
 * Lấy danh sách bài PUBLISHED cho trang khách
 * @param {string|null} category - "NEWS" | "PROMOTION" | "STYLE" | null
 */
export const getPublishedNews = async (category = null) => {
  const where = { status: "PUBLISHED" };
  if (category) where.category = category;

  return await News.findAll({
    where,
    order: [["createdAt", "DESC"]],
    attributes: ["idNews", "title", "slug", "thumbnail", "summary", "category", "createdAt"],
  });
};

/**
 * Lấy chi tiết 1 bài theo slug (public)
 */
export const getNewsBySlug = async (slug) => {
  return await News.findOne({
    where: { slug, status: "PUBLISHED" },
  });
};

// ─────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────

/**
 * Admin lấy tất cả bài (kể cả DRAFT), có filter
 * @param {object} filters - { category, status }
 */
export const getAllNews = async ({ category, status } = {}) => {
  const where = {};
  if (category) where.category = category;
  if (status)   where.status   = status;

  return await News.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Admin tạo bài viết mới
 */
export const createNews = async (data) => {
  // Kiểm tra slug trùng
  const existing = await News.findOne({ where: { slug: data.slug } });
  if (existing) {
    const err = new Error("Slug đã tồn tại, vui lòng dùng slug khác.");
    err.code = "SLUG_DUPLICATE";
    throw err;
  }

  return await News.create({
    title:     data.title,
    slug:      data.slug,
    thumbnail: data.thumbnail || null,
    summary:   data.summary   || null,
    content:   data.content,
    category:  data.category  || "NEWS",
    status:    data.status    || "DRAFT",
  });
};

/**
 * Admin cập nhật bài viết
 */
export const updateNews = async (idNews, data) => {
  const news = await News.findByPk(idNews);
  if (!news) {
    const err = new Error("Không tìm thấy bài viết.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Nếu đổi slug thì kiểm tra trùng với bài khác
  if (data.slug && data.slug !== news.slug) {
    const existing = await News.findOne({ where: { slug: data.slug } });
    if (existing) {
      const err = new Error("Slug đã tồn tại, vui lòng dùng slug khác.");
      err.code = "SLUG_DUPLICATE";
      throw err;
    }
  }

  await news.update({
    title:     data.title     ?? news.title,
    slug:      data.slug      ?? news.slug,
    thumbnail: data.thumbnail ?? news.thumbnail,
    summary:   data.summary   ?? news.summary,
    content:   data.content   ?? news.content,
    category:  data.category  ?? news.category,
    status:    data.status    ?? news.status,
  });

  return news;
};

/**
 * Admin xoá bài viết
 */
export const deleteNews = async (idNews) => {
  const news = await News.findByPk(idNews);
  if (!news) {
    const err = new Error("Không tìm thấy bài viết.");
    err.code = "NOT_FOUND";
    throw err;
  }
  await news.destroy();
  return true;
};
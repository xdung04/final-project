import cloudinary from "../config/cloudinary.js";// services/newsService.js
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
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "news" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const createNews = async (body, file) => {
  let thumbnail = null;
  if (file) {
    const result = await uploadToCloudinary(file.buffer);
    thumbnail = result.secure_url;
  }
  return await db.News.create({ ...body, thumbnail });
};

export const updateNews = async (idNews, body, file) => {
  const news = await db.News.findByPk(idNews);
  if (!news) {
    const err = new Error("Không tìm thấy bài viết.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Chỉ upload nếu có ảnh mới, không thì giữ URL cũ
  let thumbnail = news.thumbnail;
  if (file) {
    const result = await uploadToCloudinary(file.buffer);
    thumbnail = result.secure_url;
  }

  await news.update({ ...body, thumbnail });
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
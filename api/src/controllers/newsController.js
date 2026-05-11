// controllers/newsController.js
import * as newsService from "../services/newsService.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

// ─────────────────────────────────────────────────────────────
// Cloudinary upload config (thumbnail)
// ─────────────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "news",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
    public_id: (req, file) =>
      `news_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Chỉ chấp nhận ảnh jpg, jpeg, png, webp"));
  },
});

// ─────────────────────────────────────────────────────────────
// PUBLIC controllers
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/news
 * Query: ?category=STYLE
 */
export const getPublishedNews = async (req, res) => {
  try {
    const { category } = req.query;
    const news = await newsService.getPublishedNews(category || null);
    res.json({ success: true, data: news });
  } catch (err) {
    console.error("Lỗi lấy danh sách tin tức:", err);
    res.status(500).json({ message: "Không thể lấy danh sách tin tức." });
  }
};

/**
 * GET /api/news/:slug
 */
export const getNewsBySlug = async (req, res) => {
  try {
    const news = await newsService.getNewsBySlug(req.params.slug);
    if (!news) return res.status(404).json({ message: "Không tìm thấy bài viết." });
    res.json({ success: true, data: news });
  } catch (err) {
    console.error("Lỗi lấy bài viết:", err);
    res.status(500).json({ message: "Không thể lấy bài viết." });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN controllers
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/news
 * Query: ?category=STYLE&status=DRAFT
 */
export const getAllNews = async (req, res) => {
  try {
    const { category, status } = req.query;
    const news = await newsService.getAllNews({ category, status });
    res.json({ success: true, data: news });
  } catch (err) {
    console.error("Lỗi lấy danh sách (admin):", err);
    res.status(500).json({ message: "Không thể lấy danh sách tin tức." });
  }
};

/**
 * POST /api/admin/news
 * Body (multipart/form-data): title, slug, summary, content, category, status
 * File: thumbnail (optional)
 */
export const createNews = async (req, res) => {
  try {
    const { title, slug, summary, content, category, status } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Tiêu đề không được để trống." });
    if (!slug?.trim())  return res.status(400).json({ message: "Slug không được để trống." });
    if (!content?.trim()) return res.status(400).json({ message: "Nội dung không được để trống." });

    // Nếu có upload ảnh thì dùng URL từ Cloudinary, không thì lấy từ body
    const thumbnail = req.file?.path || req.body.thumbnail || null;

    const news = await newsService.createNews({
      title, slug, summary, content, category, status, thumbnail,
    });

    res.status(201).json({
      success: true,
      message: "Tạo bài viết thành công.",
      data: news,
    });
  } catch (err) {
    if (err.code === "SLUG_DUPLICATE") {
      return res.status(409).json({ message: err.message });
    }
    console.error("Lỗi tạo bài viết:", err);
    res.status(500).json({ message: "Tạo bài viết thất bại.", error: err.message });
  }
};

/**
 * PUT /api/admin/news/:id
 * Body (multipart/form-data hoặc JSON): các field cần cập nhật
 */
export const updateNews = async (req, res) => {
  try {
    const idNews = parseInt(req.params.id);
    if (isNaN(idNews)) return res.status(400).json({ message: "ID không hợp lệ." });

    // Nếu có upload ảnh mới thì ghi đè thumbnail
    const updateData = { ...req.body };
    if (req.file?.path) updateData.thumbnail = req.file.path;

    const news = await newsService.updateNews(idNews, updateData);

    res.json({
      success: true,
      message: "Cập nhật bài viết thành công.",
      data: news,
    });
  } catch (err) {
    if (err.code === "NOT_FOUND")      return res.status(404).json({ message: err.message });
    if (err.code === "SLUG_DUPLICATE") return res.status(409).json({ message: err.message });
    console.error("Lỗi cập nhật bài viết:", err);
    res.status(500).json({ message: "Cập nhật thất bại.", error: err.message });
  }
};

/**
 * DELETE /api/admin/news/:id
 */
export const deleteNews = async (req, res) => {
  try {
    const idNews = parseInt(req.params.id);
    if (isNaN(idNews)) return res.status(400).json({ message: "ID không hợp lệ." });

    await newsService.deleteNews(idNews);

    res.json({ success: true, message: "Xoá bài viết thành công." });
  } catch (err) {
    if (err.code === "NOT_FOUND") return res.status(404).json({ message: err.message });
    console.error("Lỗi xoá bài viết:", err);
    res.status(500).json({ message: "Xoá bài viết thất bại.", error: err.message });
  }
};
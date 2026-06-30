import * as newsService from "../services/newsService.js";
import multer from "multer";

// Dùng memoryStorage — giống hairstyle
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Chỉ chấp nhận ảnh jpg, jpeg, png, webp"));
  },
});

// PUBLIC
export const getPublishedNews = async (req, res) => {
  try {
    const { category } = req.query;
    const news = await newsService.getPublishedNews(category || null);
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy danh sách tin tức." });
  }
};

export const getNewsBySlug = async (req, res) => {
  try {
    const news = await newsService.getNewsBySlug(req.params.slug);
    if (!news) return res.status(404).json({ message: "Không tìm thấy bài viết." });
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy bài viết." });
  }
};

// ADMIN
export const getAllNews = async (req, res) => {
  try {
    const { category, status } = req.query;
    const news = await newsService.getAllNews({ category, status });
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy danh sách tin tức." });
  }
};

export const createNews = async (req, res) => {
  try {
    const { title, slug, summary, content, category, status } = req.body;

    if (!title?.trim())   return res.status(400).json({ message: "Tiêu đề không được để trống." });
    if (!slug?.trim())    return res.status(400).json({ message: "Slug không được để trống." });
    if (!content?.trim()) return res.status(400).json({ message: "Nội dung không được để trống." });

    const news = await newsService.createNews(
      { title, slug, summary, content, category, status },
      req.file // truyền file buffer xuống service
    );

    res.status(201).json({ success: true, message: "Tạo bài viết thành công.", data: news });
  } catch (err) {
    if (err.code === "SLUG_DUPLICATE") return res.status(409).json({ message: err.message });
    res.status(500).json({ message: "Tạo bài viết thất bại.", error: err.message });
  }
};

export const updateNews = async (req, res) => {
  try {
    const idNews = parseInt(req.params.id);
    if (isNaN(idNews)) return res.status(400).json({ message: "ID không hợp lệ." });

    const news = await newsService.updateNews(
      idNews,
      req.body,
      req.file // truyền file buffer xuống service
    );

    res.json({ success: true, message: "Cập nhật bài viết thành công.", data: news });
  } catch (err) {
    if (err.code === "NOT_FOUND")      return res.status(404).json({ message: err.message });
    if (err.code === "SLUG_DUPLICATE") return res.status(409).json({ message: err.message });
    res.status(500).json({ message: "Cập nhật thất bại.", error: err.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    const idNews = parseInt(req.params.id);
    if (isNaN(idNews)) return res.status(400).json({ message: "ID không hợp lệ." });

    await newsService.deleteNews(idNews);
    res.json({ success: true, message: "Xoá bài viết thành công." });
  } catch (err) {
    if (err.code === "NOT_FOUND") return res.status(404).json({ message: err.message });
    res.status(500).json({ message: "Xoá bài viết thất bại.", error: err.message });
  }
};
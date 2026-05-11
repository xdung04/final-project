// controllers/bannerController.js
import * as bannerService from "../services/bannerService.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

/**
 * Public - Lấy banner active cho Home
 */
export const getActiveBanners = async (req, res) => {
  try {
    const banners = await bannerService.getActiveBanners();
    const imageUrls = banners.map(b => b.imageUrl);
    res.json(imageUrls); // Frontend Home chỉ cần mảng URL
  } catch (err) {
    console.error("Lỗi lấy banner:", err);
    res.status(500).json({ message: "Không thể lấy banner" });
  }
};

/**
 * Admin - Tạo banner mới
 */
export const createBanner = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng upload ảnh banner" });
    }

    const imageUrl = req.file.path;

    const banner = await bannerService.createBanner({
      title: req.body.title || null,
      imageUrl,
      linkUrl: req.body.linkUrl || null,
      startAt: req.body.startAt || null,
      endAt: req.body.endAt || null,
      createdBy: req.user.idUser,
    });

    res.status(201).json({
      success: true,
      message: "Tạo banner thành công",
      data: banner,
    });
  } catch (err) {
    console.error("Lỗi tạo banner:", err);
    res.status(500).json({
      message: "Tạo banner thất bại",
      error: err.message
    });
  }
};

// Upload config cho banner (giữ nguyên Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
    public_id: (req, file) => `banner_${Date.now()}_${Math.round(Math.random() * 1E9)}`,
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Chỉ chấp nhận ảnh định dạng jpg, jpeg, png, webp"));
  },
});

export { upload };
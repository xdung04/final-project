import express from "express";
import multer from "multer";
import {
  getQuizController,
  validateFaceController,
  generateRecommendation,
} from "../controllers/hairConsultController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ chấp nhận ảnh"));
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Chỉ chấp nhận JPEG, PNG, hoặc WebP"));
    }
    cb(null, true);
  },
});

router.get("/quiz", getQuizController);

router.post("/validate-face", upload.single("image"), validateFaceController);

router.post(
  "/recommendation",
  upload.single("image"),
  generateRecommendation
);

router.use((err, req, res, next) => {
  console.error("Route error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: {
          message: "Ảnh quá lớn (max 5MB)",
          code: "FILE_TOO_LARGE",
        },
      });
    }
    if (err.code === "FILE_REJECTED") {
      return res.status(400).json({
        success: false,
        error: {
          message: err.message,
          code: "INVALID_FILE",
        },
      });
    }
  }

  return res.status(500).json({
    success: false,
    error: {
      message: err.message || "Lỗi không xác định",
      code: "UNKNOWN_ERROR",
    },
  });
});

export default router;
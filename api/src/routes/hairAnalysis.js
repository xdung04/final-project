import express from "express";
import multer from "multer";
import {
  saveAnalysisResult,
  rateAnalysisResult,
  getMyHistory,
  tryOnHairstyles,
} from "../controllers/hairAnalysisController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage(); // Lưu vào memory (buffer)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh"), false);
    }
  }
});

router.post("/save", authenticate, saveAnalysisResult);
router.patch("/:idAnalysis/rate", authenticate, rateAnalysisResult);
router.get("/my-history", authenticate, getMyHistory);
router.post(
  "/try-on",
  authenticate,
  upload.single("faceImage"),     // Chỉ nhận 1 file faceImage
  tryOnHairstyles
);

export default router;
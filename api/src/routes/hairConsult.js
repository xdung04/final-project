import express from "express";
import multer from "multer";
import {
  getQuiz,
  generateRecommendation,
} from "../controllers/hairConsultController.js";

const router = express.Router();
const upload = multer();

router.get("/quiz", getQuiz);

router.post(
  "/recommendation",
  upload.single("image"),
  generateRecommendation
);

export default router;

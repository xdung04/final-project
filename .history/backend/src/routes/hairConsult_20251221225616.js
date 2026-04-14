import express from "express";
import hairConsultController from "../controllers/hairConsultController.js";

const router = express.Router();

// GET quiz
router.get("/quiz", hairConsultController.getQuiz);

// POST recommendation (tạm thời chưa dùng file ảnh)
router.post("/recommendation", hairConsultController.generateRecommendation);

export default router;

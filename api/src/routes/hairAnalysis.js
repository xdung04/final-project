import express from "express";
import {
  saveAnalysisResult,
  rateAnalysisResult,
  getMyHistory,
} from "../controllers/hairAnalysisController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/save", authenticate, saveAnalysisResult);
router.patch("/:idAnalysis/rate", authenticate, rateAnalysisResult);
router.get("/my-history", authenticate, getMyHistory);

export default router;
// routes/summaryRoutes.js
import express from "express";
import { getBranchSummary ,getAISummaryModel} from "../controllers/summaryController.js";

const router = express.Router();

router.get("/", getBranchSummary);
router.get("/ai-model", getAISummaryModel);

export default router;

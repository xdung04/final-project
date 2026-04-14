// routes/summaryRoutes.js
import express from "express";
import { getBranchSummary } from "../controllers/summaryController.js";

const router = express.Router();

router.get("/", getBranchSummary);

export default router;

import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { getMyBranch } from "../controllers/receptionistController.js";

const router = express.Router();

router.get("/my-branch", authenticate, getMyBranch);

export default router;

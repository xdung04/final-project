import express from "express";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  getAllBranches,
  syncBranchesToPinecone,
  setSuspendDate, 
  setResumeDate,
} from "../controllers/branchController.js";

const router = express.Router();

router.post("/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);
router.get("/", getAllBranches);
router.post("/sync-pinecone", syncBranchesToPinecone);
router.patch("/:id/suspend", setSuspendDate);
router.patch("/:id/resume", setResumeDate);
export default router; 
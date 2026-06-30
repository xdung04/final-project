import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { getMyBranch, getReceptionistByBranchId, updateReceptionist } from "../controllers/receptionistController.js";

const router = express.Router();

// Receptionist lấy branch của mình
router.get("/my-branch", authenticate, getMyBranch);

// Admin lấy thông tin lễ tân theo idBranch
router.get("/branch/:idBranch", authenticate, authorize(["admin"]), getReceptionistByBranchId);

// Admin cập nhật thông tin lễ tân
router.put("/branch/:idBranch", authenticate, authorize(["admin"]), updateReceptionist);

export default router;

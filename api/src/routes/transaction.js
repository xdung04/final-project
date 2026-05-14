import express from "express";
import transactionController from "../controllers/transactionController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tầng bảo vệ nghiêm ngặt: Chỉ cho phép Request đã đăng nhập VÀ có quyền Lễ tân đi qua
router.use(authenticate, authorize(["receptionist"]));

// Các API Endpoint bên trong hoàn toàn an toàn
router.get("/stats", transactionController.getSummaryStats);
router.get("/", transactionController.getAllTransactions);

export default router;
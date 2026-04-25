import express from "express";
import * as salaryController from "../controllers/salaryController.js";

const router = express.Router();

// Lấy bảng lương cho một tháng (real-time)
router.get("/", salaryController.getSalaries);

// Lấy danh sách tháng + trạng thái lương (overview)
router.get("/overview", salaryController.getSalaryOverview);

// Xác nhận tính lương toàn bộ thợ cho một tháng
router.post("/confirm", salaryController.confirmSalary);

export default router;

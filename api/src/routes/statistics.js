import express from "express";
import statisticsController from "../controllers/statisticsController.js";

const router = express.Router();

// Doanh thu tất cả thợ
// GET /statistics/barbers?month=..&year=..&branchId=..
router.get("/barbers", statisticsController.getBarberRevenue);

// Tổng doanh thu từng tháng của các chi nhánh trong năm
// GET /statistics/branches?year=..
router.get("/branches", statisticsController.getMonthlyBranchRevenue);

// GET /statistics/overview?month=..&year=..
router.get("/overview", statisticsController.getDashboardOverview);

export default router;

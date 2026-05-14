import express from "express";
import * as customerStatsController from "../controllers/customerStatsController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/overview", authenticate, customerStatsController.customerOverview);
router.get("/monthly", authenticate, customerStatsController.monthlyCustomerStats);
router.get("/at-risk", authenticate, customerStatsController.atRiskCustomers);
router.get("/segments", authenticate, customerStatsController.customerSegments);

export default router;
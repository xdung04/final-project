import express from "express";
import * as contractController from "../controllers/contractController.js";
import { authorize } from "../middlewares/authMiddleware.js";
import barber from "../models/barber.js";

const router = express.Router();

// Tất cả các route này chỉ dành cho Admin
const barberOnly = authorize(["barber"]);



router.get("/my-contract",barberOnly, contractController.getMyContract);       // Hợp đồng đang active
router.get("/my-history", barberOnly, contractController.getMyContractHistory); // Lịch sử tất cả hợp đồng

export default router;
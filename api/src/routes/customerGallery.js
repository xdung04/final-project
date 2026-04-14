import express from "express";
import * as customerGalleryController from "../controllers/customerGalleryController.js";
import { authenticate } from "../middlewares/authMiddleware.js";


const router = express.Router();

// Lấy danh sách sản phẩm đã hoàn thành của 1 thợ
router.get("/barber/:barberId", customerGalleryController.getByBarber);

router.get("/customer", authenticate, customerGalleryController.getByCustomer);

export default router;

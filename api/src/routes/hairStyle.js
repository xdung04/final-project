"use strict";
import express from "express";
import * as hairstyleController from "../controllers/hairStyleController.js";
import { authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Định nghĩa Middleware phân quyền cho Admin
const adminOnly = authorize(["admin"]);

// ==========================================
// 1. ROUTES CHO CLIENT (HOME & BOOKING)
// ==========================================
// Khách hàng không cần đăng nhập vẫn xem được danh sách và chi tiết kiểu tóc công khai
router.get(
  "/client/categories-with-hairstyles", 
  hairstyleController.getClientCategoriesWithHairstyles
);
router.get(
  "/client/hairstyles/:slug", 
  hairstyleController.getClientHairstyleDetail
);

// ==========================================
// 2. ROUTES CHO ADMIN (DASHBOARD CRUD)
// ==========================================

/* --- QUẢN LÝ DANH MỤC (CATEGORIES) --- */
router.get(
  "/admin/categories", 
  hairstyleController.getAdminCategories
);
router.post(
  "/admin/categories", 
  hairstyleController.createAdminCategory
);
router.put(
  "/admin/categories/:idCategory", 
  hairstyleController.updateAdminCategory
);
router.delete(
  "/admin/categories/:idCategory", 
  hairstyleController.deleteAdminCategory
);

/* --- QUẢN LÝ KIỂU TÓC (HAIRSTYLES) --- */
router.get(
  "/admin/hairstyles", 
  hairstyleController.getAdminHairstyles
);
router.post(
  "/admin/hairstyles", 
  hairstyleController.createAdminHairstyle
);
router.put(
  "/admin/hairstyles/:idHairstyle", 
  adminOnly, 
  hairstyleController.updateAdminHairstyle
);
router.delete(
  "/admin/hairstyles/:idHairstyle", 
  adminOnly, 
  hairstyleController.deleteAdminHairstyle
);

export default router;
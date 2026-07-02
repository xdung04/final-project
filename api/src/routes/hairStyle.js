"use strict";
import express from "express";
import * as hairstyleController from "../controllers/hairStyleController.js";
import { authenticate, authorize,optionalAuthenticate } from "../middlewares/authMiddleware.js"; // ← thêm authenticate
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const adminOnly = authorize(["admin"]);

// ==========================================
// 1. ROUTES CHO CLIENT
// ==========================================
router.get("/client/categories-with-hairstyles", optionalAuthenticate, hairstyleController.getClientCategoriesWithHairstyles);
router.get("/client/hairstyles/:slug", optionalAuthenticate, hairstyleController.getClientHairstyleDetail);

// ==========================================
// 2. ROUTES CHO ADMIN
// ==========================================

/* --- CATEGORIES --- */
router.get("/admin/categories", authenticate, adminOnly, hairstyleController.getAdminCategories);
router.post("/admin/categories", authenticate, adminOnly, hairstyleController.createAdminCategory);
router.put("/admin/categories/:idCategory", authenticate, adminOnly, hairstyleController.updateAdminCategory);
router.delete("/admin/categories/:idCategory", authenticate, adminOnly, hairstyleController.deleteAdminCategory);

/* --- HAIRSTYLES --- */
router.get("/admin/hairstyles", authenticate, adminOnly, hairstyleController.getAdminHairstyles);

router.post(
  "/admin/hairstyles",
  authenticate,
  adminOnly,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "sideImage", maxCount: 1 },
  ]),
  hairstyleController.createAdminHairstyle
);

router.put(
  "/admin/hairstyles/:idHairstyle",
  authenticate,
  adminOnly,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "sideImage", maxCount: 1 },
  ]),
  hairstyleController.updateAdminHairstyle
);

router.delete("/admin/hairstyles/:idHairstyle", authenticate, adminOnly, hairstyleController.deleteAdminHairstyle);

export default router;
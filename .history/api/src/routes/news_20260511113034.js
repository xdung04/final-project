// routes/newsRouter.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import * as newsController from "../controllers/newsController.js";
import { upload } from "../controllers/newsController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────

// GET /api/news?category=STYLE
router.get("/", newsController.getPublishedNews);

// GET /api/news/:slug
router.get("/:slug", newsController.getNewsBySlug);

// ─────────────────────────────────────────────────────────────
// ADMIN — yêu cầu JWT
// ─────────────────────────────────────────────────────────────

// GET /api/admin/news?category=STYLE&status=DRAFT
router.get("/admin/all", authenticate, newsController.getAllNews);

// POST /api/admin/news  (multipart/form-data, file field: "thumbnail")
router.post("/admin", authenticate, upload.single("thumbnail"), newsController.createNews);

// PUT /api/admin/news/:id
router.put("/admin/:id", authenticate, upload.single("thumbnail"), newsController.updateNews);

// DELETE /api/admin/news/:id
router.delete("/admin/:id", authenticate, newsController.deleteNews);

export default router;
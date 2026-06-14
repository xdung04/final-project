// routes/newsRouter.js
import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import * as newsController from "../controllers/newsController.js";
import { upload } from "../controllers/newsController.js";

const router = express.Router();
const adminOnly = authorize(["admin"]);

// ── PUBLIC ──
router.get("/",      newsController.getPublishedNews);
router.get("/:slug", newsController.getNewsBySlug); // luôn để sau cùng

// ── ADMIN ──
router.get("/admin/all",
  authenticate, adminOnly,
  newsController.getAllNews
);

router.post("/admin",
  authenticate, adminOnly,
  upload.single("thumbnail"),
  newsController.createNews
);

router.put("/admin/:id",
  authenticate, adminOnly,
  upload.single("thumbnail"),
  newsController.updateNews
);

router.delete("/admin/:id",
  authenticate, adminOnly,
  newsController.deleteNews
);

export default router;
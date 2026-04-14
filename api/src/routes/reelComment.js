import express from "express";
import * as reelCommentController from "../controllers/reelCommentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true });

// Lấy comment public
router.get("/:id/comments", reelCommentController.getComments);

// Thêm comment / reply (auth)
router.post("/:id/comment", authenticate, reelCommentController.addComment);
router.post("/comment/:id/reply", authenticate, reelCommentController.addReply);

// Sửa / xoá comment (auth)
router.put("/comment/:id", authenticate, reelCommentController.updateComment);
router.delete("/comment/:id", authenticate, reelCommentController.deleteComment);

export default router;

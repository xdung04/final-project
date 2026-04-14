import express from "express";
import * as reelController from "../controllers/reelController.js";
import { uploadReel } from "../middlewares/uploadMiddleware.js";
import { authenticate, optionalAuthenticate} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Search reels (public)
router.get("/search", optionalAuthenticate, reelController.searchReels);

// Danh sách reels (public)
router.get("/", optionalAuthenticate, reelController.getAll);

router.get("/barber/:idBarber", optionalAuthenticate, reelController.getReelsByBarberId);


// Upload video (cần auth)
router.post(
  "/upload",
  authenticate,
  uploadReel.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  reelController.uploadReel
);

// Ghi nhận lượt xem (cần auth)
router.post("/:id/view", authenticate, reelController.trackView);

// Like / Unlike reel (cần auth)
router.post("/:id/like", authenticate, reelController.toggleLike);

// Lấy chi tiết reel (có thể public, idUser optional)
router.get("/:id", reelController.getById);

export default router;

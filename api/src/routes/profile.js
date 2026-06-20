import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {uploadBasic} from "../middlewares/uploadMiddleware.js";
import profileController from "../controllers/profileController.js";

const router = express.Router();

// Lấy profile
router.get("/", authenticate, profileController.getProfile);

// Cập nhật profile
router.put("/", authenticate, uploadBasic.single("avatar"), profileController.updateProfile);

router.put("/phone", authenticate, profileController.updatePhone);

router.put(
   "/change-password",
   authenticate,
   profileController.changePassword
);
export default router;

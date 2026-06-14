import express from "express";
import { handleChat, handlePostLoginSync,handleRequestHuman,handleCloseConversationOnLogout } from "../controllers/chatController.js";
import {  authenticate ,optionalAuthenticate} from "../middlewares/authMiddleware.js"; // 💡 Import middleware check token của mày vào đây
import { auth } from "google-auth-library";

const router = express.Router();
router.post("/", optionalAuthenticate, handleChat);
router.post("/sync", authenticate, handlePostLoginSync);
router.post("/request-human", authenticate, handleRequestHuman);
router.post("/logout-clean", authenticate, handleCloseConversationOnLogout);
export default router;
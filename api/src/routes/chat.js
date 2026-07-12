import express from "express";
import { 
  handleChat, handlePostLoginSync, handleRequestHuman, 
  handleCloseConversationOnLogout, handleClearConversation, 
  handleCancelWaiting, handleLeaveLiveChat 
} from "../controllers/chatController.js";
import {  authenticate ,optionalAuthenticate} from "../middlewares/authMiddleware.js"; // 💡 Import middleware check token của mày vào đây
import { auth } from "google-auth-library";

const router = express.Router();
router.post("/", optionalAuthenticate, handleChat);
router.post("/sync", authenticate, handlePostLoginSync);
router.post("/request-human", authenticate, handleRequestHuman);
router.post("/logout-clean", authenticate, handleCloseConversationOnLogout);
router.delete("/conversation", optionalAuthenticate, handleClearConversation); // guest + customer
router.post("/cancel-waiting", authenticate, handleCancelWaiting);              // chỉ customer
router.post("/leave-live", authenticate, handleLeaveLiveChat);  
export default router;
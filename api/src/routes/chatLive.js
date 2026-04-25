// api/src/routes/chatRoutes.js
import express from "express";
import * as chatController from "../controllers/chatLiveController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Customer routes
router.get(
  "/conversation/:customerId",
  authenticate,
  chatController.getOrCreateConversation
);
router.get("/history/:conversationId", authenticate, chatController.getHistory);
router.post("/close/:conversationId", authenticate, chatController.closeConversation);

// Receptionist routes
router.post("/receptionist/join", authenticate, chatController.receptionistJoin);
router.post("/receptionist/leave", authenticate, chatController.receptionistLeave);
router.post("/transfer", authenticate, chatController.transferConversation);
router.get(
  "/active-conversations",
  authenticate,
  chatController.getActiveConversations
);
router.get(
  "/waiting-conversations",
  authenticate,
  chatController.getWaitingConversations
);

// Admin routes
router.get("/all-conversations", authenticate, chatController.getAllConversations);

router.get("/receptionists", authenticate, chatController.handleGetAllReceptionists);

export default router;
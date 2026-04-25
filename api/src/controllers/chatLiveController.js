// api/src/controllers/chatLiveController.js
import * as chatService from "../services/chatLiveService.js";

/**
 * GET /api/chat/conversation/:customerId
 * Lấy hoặc tạo conversation cho customer
 */
export const getOrCreateConversation = async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);

    const conversation = await chatService.getOrCreateConversation(customerId);

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    console.error("Lỗi lấy/tạo conversation:", err);
    res.status(500).json({ error: "Không thể lấy hoặc tạo cuộc trò chuyện" });
  }
};

/**
 * GET /api/chat/history/:conversationId
 * Lấy lịch sử chat
 */
export const getHistory = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await chatService.getConversationHistory(
      conversationId,
      limit,
      offset
    );

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    console.error("Lỗi lấy lịch sử chat:", err);
    res.status(500).json({ error: "Không thể lấy lịch sử trò chuyện" });
  }
};

/**
 * POST /api/chat/receptionist/join
 * Body: { conversationId, receptionistId }
 */
export const receptionistJoin = async (req, res) => {
  try {
    const { conversationId, receptionistId } = req.body;

    const result = await chatService.receptionistJoin(
      parseInt(conversationId),
      parseInt(receptionistId)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Lỗi lễ tân join:", err);
    res.status(500).json({ error: err.message || "Không thể join cuộc trò chuyện" });
  }
};

/**
 * POST /api/chat/receptionist/leave
 * Body: { conversationId, receptionistId }
 */
export const receptionistLeave = async (req, res) => {
  try {
    const { conversationId, receptionistId } = req.body;

    const result = await chatService.receptionistLeave(
      parseInt(conversationId),
      parseInt(receptionistId)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Lỗi lễ tân leave:", err);
    res.status(500).json({ error: err.message || "Không thể rời cuộc trò chuyện" });
  }
};

/**
 * POST /api/chat/transfer
 * Body: { conversationId, fromReceptionistId, toReceptionistId }
 */
export const transferConversation = async (req, res) => {
  try {
    const { conversationId, fromReceptionistId, toReceptionistId } = req.body;

    const result = await chatService.transferConversation(
      parseInt(conversationId),
      parseInt(fromReceptionistId),
      parseInt(toReceptionistId)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Lỗi transfer conversation:", err);
    res.status(500).json({ error: err.message || "Không thể chuyển cuộc trò chuyện" });
  }
};

/**
 * POST /api/chat/close/:conversationId
 * Đóng conversation
 */
export const closeConversation = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);

    const result = await chatService.closeConversation(conversationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Lỗi đóng conversation:", err);
    res.status(500).json({ error: "Không thể đóng cuộc trò chuyện" });
  }
};

/**
 * GET /api/chat/active-conversations
 * Lấy danh sách active conversations
 */
export const getActiveConversations = async (req, res) => {
  try {
    const receptionistId = req.query.receptionistId
      ? parseInt(req.query.receptionistId)
      : null;

    const conversations = await chatService.getActiveConversations(receptionistId);

    const result = conversations.map((conv) => ({
      id: conv.id,
      customerId: conv.customerId,
      customerName: conv.customer?.user?.fullName || "Unknown",
      customerImage: conv.customer?.user?.image,
      mode: conv.mode,
      status: conv.status,
      assignedReceptionist: conv.assignedReceptionist
        ? {
            id: conv.assignedReceptionist.idReceptionist,
            name: conv.assignedReceptionist.user?.fullName,
          }
        : null,
      lastUpdated: conv.updatedAt,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi lấy active conversations:", err);
    res.status(500).json({ error: "Không thể lấy danh sách cuộc trò chuyện" });
  }
};

/**
 * GET /api/chat/waiting-conversations
 * Lấy danh sách waiting conversations
 */
export const getWaitingConversations = async (req, res) => {
  try {
    const conversations = await chatService.getWaitingConversations();

    const result = conversations.map((conv) => ({
      id: conv.id,
      customerId: conv.customerId,
      customerName: conv.customer?.user?.fullName || "Unknown",
      customerImage: conv.customer?.user?.image,
      customerPhone: conv.customer?.user?.phoneNumber,
      mode: conv.mode,
      status: conv.status,
      createdAt: conv.createdAt,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi lấy waiting conversations:", err);
    res.status(500).json({ error: "Không thể lấy danh sách chờ" });
  }
};

/**
 * GET /api/chat/all-conversations
 * Lấy tất cả conversations (cho admin)
 */
export const getAllConversations = async (req, res) => {
  try {
    const status = req.query.status || null;

    const conversations = await chatService.getAllConversations(status);

    const result = conversations.map((conv) => ({
      id: conv.id,
      customerId: conv.customerId,
      customerName: conv.customer?.user?.fullName || "Unknown",
      mode: conv.mode,
      status: conv.status,
      assignedReceptionist: conv.assignedReceptionist
        ? {
            id: conv.assignedReceptionist.idReceptionist,
            name: conv.assignedReceptionist.user?.fullName,
          }
        : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi lấy tất cả conversations:", err);
    res.status(500).json({ error: "Không thể lấy danh sách" });
  }
};

export const handleGetAllReceptionists = async (req, res) => {
  try {
    const data = await chatService.getAllReceptionists();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Lỗi getAllReceptionists:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
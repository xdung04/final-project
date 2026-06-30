import * as chatService from "../services/chatLiveService.js";
import { getIO } from "../config/socket.js";

export const getOrCreateConversation = async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const { conversation, isNew } = await chatService.getOrCreateConversation(customerId);
    
    const io = getIO();
    if (io && isNew) {
      io.emit("conversation_updated"); // 🔥 Báo cho tất cả receptionist
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const history = await chatService.getConversationHistory(
      conversationId,
      limit,
      offset,
    );
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Trong hàm receptionistJoin, thêm emit sau khi join thành công
export const receptionistJoin = async (req, res) => {
  try {
    const { conversationId, receptionistId } = req.body;
    const result = await chatService.receptionistJoin(
      parseInt(conversationId),
      parseInt(receptionistId),
    );
    const io = getIO();
    if (io && result.systemMessage) {
      io.to(conversationId).emit("receive_message", result.systemMessage);
      // 🔥 Báo cho tất cả lễ tân khác biết conversation đã được nhận
      io.emit("conversation_updated");
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const receptionistLeave = async (req, res) => {
  try {
    const { conversationId, receptionistId } = req.body;
    
    // 1. Chỉ cập nhật DB (Hàm service của bạn sẽ tự tạo systemMessage và chuyển status = "waiting")
    const result = await chatService.receptionistLeave(
      parseInt(conversationId),
      parseInt(receptionistId),
    );
    
    // 2. Trả về client thành công luôn, KHÔNG cần phát io.emit ở đây nữa
    // Để tránh việc đá nhau với socket.emit ở Frontend gởi lên ngay sau đó
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const transferConversation = async (req, res) => {
  try {
    const { conversationId, fromReceptionistId, toReceptionistId } = req.body;
    const result = await chatService.transferConversation(
      parseInt(conversationId),
      parseInt(fromReceptionistId),
      parseInt(toReceptionistId),
    );
    const io = getIO();
    if (io) {
      if (result.systemMessage)
        io.to(conversationId).emit("receive_message", result.systemMessage);
      
      // 🔥 Emit riêng cho receptionist nhận — không phụ thuộc room
      io.emit("conversation_transfer_notify", {
        toId: toReceptionistId,
        fromName: result.systemMessage.metadata.fromName,
        conversationId,
      });

      io.emit("conversation_updated");
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const closeConversation = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const result = await chatService.closeConversation(conversationId);
    const io = getIO();
    if (io) {
      
      io.to(String(conversationId)).emit("conversation_closed", { conversationId });
      io.emit("conversation_updated");
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getActiveConversations = async (req, res) => {
  try {
    const receptionistId = req.query.receptionistId
      ? parseInt(req.query.receptionistId)
      : null;
    const conversations =
      await chatService.getActiveConversations(receptionistId);
    const result = conversations.map((conv) => ({
      id: conv.id,
      customerId: conv.customerId,
      customerName: conv.customer?.user?.fullName || "Unknown",
      customerImage: conv.customer?.user?.image,
      customerPhone: conv.customer?.user?.phoneNumber,
      mode: conv.mode,
      status: conv.status,
      assignedReceptionist: conv.assignedReceptionist
        ? {
            id: conv.assignedReceptionist.idReceptionist,
            name: conv.assignedReceptionist.user?.fullName,
          }
        : null,
      lastUpdated: conv.updatedAt,
      lastMessage: conv.lastMessage,
      unreadCount: Number(conv.unread_count || conv.unreadCount || 0),
    }));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
      lastMessage: conv.lastMessage,
      unreadCount: Number(conv.unread_count || conv.unreadCount || 0),
    }));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchConversations = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const status = req.query.status || null;
    const conversations = await chatService.searchConversations(
      keyword,
      status,
    );
    const result = conversations.map((conv) => ({
      id: conv.id,
      customerId: conv.customerId,
      customerName: conv.customer?.user?.fullName || "Unknown",
      customerPhone: conv.customer?.user?.phoneNumber,
      mode: conv.mode,
      status: conv.status,
      assignedReceptionist: conv.assignedReceptionist
        ? {
            id: conv.assignedReceptionist.idReceptionist,
            name: conv.assignedReceptionist.user?.fullName,
          }
        : null,
      lastUpdated: conv.updatedAt,
      lastMessage: conv.lastMessage,
      unreadCount:Number(conv.unread_count || conv.unreadCount || 0),
    }));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const handleGetAllReceptionists = async (req, res) => {
  try {
    const data = await chatService.getAllReceptionists();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

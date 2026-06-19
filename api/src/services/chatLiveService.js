import db from "../models/index.js";
import { getIO } from "../config/socket.js";
const { Conversation, Message, Customer, Receptionist, User, Sequelize } = db;
const { Op } = Sequelize;

// Helper: cập nhật last_message và unread_count cho conversation
// Helper: cập nhật last_message và unread_count cho conversation
export const updateConversationStats = async (
  conversationId,
  newMessage,
  increaseUnread = false,
) => {
  const updateData = {
    lastMessage:
      newMessage.content ||
      (newMessage.eventType
        ? `📢 ${newMessage.eventType.toUpperCase()}`
        : "Tin nhắn mới"),
    updatedAt: new Date(),
  };
  
  if (increaseUnread) {
    // 🔥 FIX TẠI ĐÂY: Dùng đúng tên cột vật lý dưới Database của bạn là unread_count
    updateData.unreadCount = Sequelize.literal("`unread_count` + 1");
  }
  
  await Conversation.update(updateData, { where: { id: conversationId } });
};
/**
 * Lấy conversation của customer (1-1)
 * Nếu đã closed thì reopen
 */
export const getOrCreateConversation = async (customerId) => {
  let isNew = false;
  let conversation = await Conversation.findOne({ where: { customerId } });

  if (!conversation) {
    conversation = await Conversation.create({
      customerId,
      mode: "ai",
      status: "waiting",
      unreadCount: 0,
    });
    isNew = true; 
  } else if (conversation.status === "closed") {
    // 🔥 FIX: Khi mở lại, tin nhắn kích hoạt đó tính là 1 tin chưa đọc
    await conversation.update({
      status: "waiting",
      mode: "ai",
      assignedReceptionistId: null,
      unreadCount: 1,
    });
    await conversation.reload();
    await saveMessage({
      conversationId: conversation.id,
      senderType: "system",
      messageType: "system",
      eventType: "reopen",
      content: "🔄 Cuộc trò chuyện được mở lại",
    });
    isNew = true;
  }

  return { conversation, isNew };
};

/**
 * Lấy lịch sử chat
 */
export const getConversationHistory = async (
  conversationId,
  limit = 50,
  offset = 0,
) => {
  // Thêm try-catch để an toàn tuyệt đối
  try {
    const messages = await Message.findAll({
      where: { conversationId }, // Hoặc thử đổi thành conversation_id nếu model của bạn chưa map chuẩn underscore
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        {
          model: Receptionist,
          as: "assignedReceptionist",
          include: [{ model: User, as: "user", attributes: ["fullName", "email", "image"] }],
        },
        {
          model: Customer,
          as: "customer",
          include: [{ model: User, as: "user", attributes: ["fullName", "email", "phoneNumber", "image"] }],
        },
      ],
    });

    // Ép kiểu chắc chắn messages phải là mảng rồi mới .reverse()
    const safeMessages = Array.isArray(messages) ? messages.reverse() : [];

    return { conversation, messages: safeMessages };

  } catch (error) {
    console.error("❌ Lỗi tại getConversationHistory:", error.message);
    // Fallback an toàn để tầng service phía trên không bị crash lỗi .map
    return { conversation: null, messages: [] }; 
  }
};

/**
 * Lưu message và cập nhật stats
 */
export const saveMessage = async ({
  conversationId,
  senderType,
  senderId,
  messageType = "text",
  content = null,
  eventType = null,
  metadata = null,
}) => {
 if (senderType !== "system" && senderType !== "ai" && !senderId) {
    throw new Error(`senderId required for ${senderType}`);
  }
  if (messageType === "text" && !content) throw new Error("content required");
  if (messageType === "system" && !eventType)
    throw new Error("eventType required");

  const conv = await Conversation.findByPk(conversationId);
  if (conv && conv.status === "closed" && senderType === "customer") {
    await conv.update({
      status: "waiting",
      mode: "ai",
      assignedReceptionistId: null,
      unreadCount: 1,
    });
    await Message.create({
      conversationId,
      senderType: "system",
      messageType: "system",
      eventType: "reopen",
      content: "🔄 Cuộc trò chuyện được mở lại",
    });
  }

  const message = await Message.create({
    conversationId,
    senderType,
    senderId,
    messageType,
    content,
    eventType,
    metadata,
  });

  const shouldIncreaseUnread = senderType === "customer"|| senderType === "system";;
  await updateConversationStats(
    conversationId,
    { content, eventType },
    shouldIncreaseUnread,
  );
  return message;
};

/**
 * Reset unread_count khi receptionist mở conversation
 */
export const resetUnreadCount = async (conversationId, receptionistId) => {
  const conv = await Conversation.findByPk(conversationId);
  if (!conv) return false;

  // 🔥 FIX: Chỉ reset khi lễ tân thực sự sở hữu phòng đang xử lý (Tránh lỗi mất chấm đỏ ở hàng chờ)
  const canReset = conv.assignedReceptionistId === receptionistId && conv.status === "in_progress";

  if (canReset) {
    await Conversation.update(
      { unreadCount: 0 },
      { where: { id: conversationId } },
    );
    
    const io = getIO();
    if (io) io.emit("conversation_updated");
    return true;
  }
  return false;
};

/**
 * Lễ tân join conversation (Bản nâng cấp: Tự động quét tin nhắn HÔM NAY và SUMMARY)
 */
export const receptionistJoin = async (conversationId, receptionistId) => {
  const result = await db.sequelize.transaction(async (t) => {
    const conversation = await Conversation.findByPk(conversationId, {
      lock: true,
      transaction: t,
    });

    if (!conversation) throw new Error("Conversation not found");

    if (
      conversation.assignedReceptionistId &&
      conversation.status === "in_progress"
    ) {
      throw new Error("Conversation already assigned to another receptionist");
    }

    const receptionist = await Receptionist.findByPk(receptionistId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["fullName", "email", "image"],
        },
      ],
      transaction: t,
    });

    if (!receptionist) throw new Error("Receptionist not found");

    let summaryContent = "Chưa có tóm tắt hội thoại ngày hôm nay.";
    try {
      const historyText = await getTodayChatHistoryText(conversationId);
      if (historyText && !historyText.includes("Chưa có lịch sử trò chuyện")) {
        const { generateChatSummary } = await import("./brainService.js");
        summaryContent = await generateChatSummary(historyText);
      }
    } catch (err) {
      console.error("Không sinh được summary cho lễ tân:", err.message);
      summaryContent = "Gặp lỗi trong quá trình tự động tóm tắt tin nhắn ngày hôm nay.";
    }

    // Khi nhận phòng thành công, đưa unreadCount về 0
    await conversation.update(
      {
        mode: "human",
        status: "in_progress",
        assignedReceptionistId: receptionistId,
        unreadCount: 0,
      },
      { transaction: t },
    );

    const systemMessage = await Message.create(
      {
        conversationId,
        senderType: "system",
        messageType: "system",
        eventType: "join",
        content: `📝 [TÓM TẮT HỘI THOẠI HÔM NAY]: ${summaryContent}`,
        metadata: {
          receptionistId,
          name: receptionist.user?.fullName || "Lễ tân",
          email: receptionist.user?.email || "",
          summary: summaryContent,
          timestamp: new Date(),
        },
      },
      { transaction: t },
    );

    return { conversation, systemMessage, receptionist };
  });

  // ✅ Ngoài transaction — Bắn tín hiệu socket chuẩn xác gọi Client chuyển phòng
  const io = getIO();
  if (io) {
    const receptionistName = result.receptionist.user?.fullName || "Lễ tân";

    // 🔥 GIỮ NGUYÊN EVENT GỐC: Báo chuẩn sự kiện giúp AIChat.jsx tự động nhảy phòng lập tức
    io.to(String(conversationId)).emit("receptionist_joined", {
      conversationId,
      receptionistName,
    });

    io.to(String(conversationId)).emit("receive_message", {
      conversationId: conversationId,
      senderType: "system",
      messageType: "system",
      eventType: "accepted", 
      content: `🎯 Lễ tân [${receptionistName}] đã tham gia hỗ trợ trực tiếp!`,
    });

    // Đồng bộ danh sách sidebar cho toàn bộ các lễ tân khác
    io.emit("conversation_updated");
  }

  return result;
};

/**
 * Lễ tân leave conversation
 */
export const receptionistLeave = async (conversationId, receptionistId) => {
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (conversation.assignedReceptionistId !== receptionistId) {
    throw new Error("Not your conversation");
  }

  const receptionist = await Receptionist.findByPk(receptionistId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["fullName"],
      },
    ],
  });

  const systemMessage = await saveMessage({
    conversationId,
    senderType: "system",
    messageType: "system",
    eventType: "leave",
    metadata: {
      receptionistId,
      name: receptionist?.user?.fullName || "Unknown",
      timestamp: new Date(),
    },
  });

  await conversation.update({
    mode: "ai",
    status: "waiting",
    assignedReceptionistId: null,
    unreadCount: 0,
  });

  const io = getIO();
  if (io) io.emit("conversation_updated");

  return { conversation, systemMessage };
};

/**
 * Transfer conversation
 */
export const transferConversation = async (
  conversationId,
  fromReceptionistId,
  toReceptionistId,
) => {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (conversation.assignedReceptionistId !== fromReceptionistId)
    throw new Error("Not your conversation");

  const fromReceptionist = await Receptionist.findByPk(fromReceptionistId, {
    include: [{ model: User, as: "user", attributes: ["fullName"] }],
  });
  const toReceptionist = await Receptionist.findByPk(toReceptionistId, {
    include: [{ model: User, as: "user", attributes: ["fullName"] }],
  });
  if (!toReceptionist) throw new Error("Target receptionist not found");

  const systemMessage = await saveMessage({
    conversationId,
    senderType: "system",
    messageType: "system",
    eventType: "transfer",
    metadata: {
      fromId: fromReceptionistId,
      fromName: fromReceptionist?.user?.fullName || "Unknown",
      toId: toReceptionistId,
      toName: toReceptionist.user.fullName,
      timestamp: new Date(),
    },
  });

  await conversation.update({ assignedReceptionistId: toReceptionistId });
  
  const io = getIO();
  if (io) io.emit("conversation_updated");

  return { conversation, systemMessage, toReceptionist };
};

/**
 * Đóng conversation
 */
export const closeConversation = async (conversationId, io) => {
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  await conversation.update({
    status: "closed",
    unreadCount: 0,
  });

  if (io) {
    io.to(String(conversationId)).emit("conversation_closed", { 
      conversationId: conversationId 
    });
    io.emit("conversation_updated");
  }

  return conversation;
};

/**
 * Active conversations (đang xử lý)
 */
export const getActiveConversations = async (receptionistId = null) => {
  const where = { status: "in_progress" };
  if (receptionistId) where.assignedReceptionistId = receptionistId;

  return await Conversation.findAll({
    where,
    include: [
      {
        model: Customer,
        as: "customer",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "email", "phoneNumber", "image"],
          },
        ],
      },
      {
        model: Receptionist,
        as: "assignedReceptionist",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "email", "image"],
          },
        ],
      },
    ],
    order: [["updatedAt", "DESC"]],
  });
};

export const getWaitingConversations = async () => {
  return await Conversation.findAll({
    where: { status: "waiting" },
    include: [
      {
        model: Customer,
        as: "customer",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "email", "phoneNumber", "image"],
          },
        ],
      },
    ],
    order: [["createdAt", "ASC"]],
  });
};

// Search conversations (closed hoặc tất cả)
export const searchConversations = async (keyword, status = null) => {
  const where = {};
  if (status) where.status = status;

  const include = [
    {
      model: Customer,
      as: "customer",
      required: true,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["fullName", "email", "phoneNumber", "image"],
        },
      ],
    },
  ];

  if (keyword) {
    where[Op.or] = [
      { "$customer.user.fullName$": { [Op.like]: `%${keyword}%` } },
      { "$customer.user.phoneNumber$": { [Op.like]: `%${keyword}%` } },
    ];
  }

  return await Conversation.findAll({
    where,
    include,
    order: [["updatedAt", "DESC"]],
  });
};

/**
 * All conversations (admin)
 */
export const getAllConversations = async (status = null) => {
  const where = {};
  if (status) where.status = status;

  return await Conversation.findAll({
    where,
    include: [
      {
        model: Customer,
        as: "customer",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "email", "phoneNumber", "image"],
          },
        ],
      },
      {
        model: Receptionist,
        as: "assignedReceptionist",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "email", "image"],
          },
        ],
      },
    ],
    order: [["updatedAt", "DESC"]],
  });
};

/**
 * Lấy tất cả lễ tân (phục vụ transfer)
 */
export const getAllReceptionists = async () => {
  const receptionists = await Receptionist.findAll({
    include: [
      {
        model: User,
        as: "user",
        attributes: ["idUser", "fullName", "email", "phoneNumber", "image"],
      },
      {
        model: db.Branch,
        as: "branch",
        attributes: ["idBranch", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return receptionists.map((r) => ({
    id: r.idReceptionist,
    name: r.user?.fullName,
    email: r.user?.email,
    phone: r.user?.phoneNumber,
    image: r.user?.image,
    branch: r.branch
      ? {
          id: r.branch.idBranch,
          name: r.branch.name,
        }
      : null,
  }));
};

export const getConversationById = async (conversationId) => {
  return await Conversation.findByPk(conversationId);
};

export const getTodayAIChatMessages = async (conversationId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return await Message.findAll({
    where: {
      conversationId,
      senderType: {
        [Op.in]: ["customer", "ai"] 
      },
      createdAt: {
        [Op.gte]: startOfToday,
        [Op.lte]: endOfToday
      }
    },
    order: [["createdAt", "ASC"]], 
  });
};

export const getTodayChatHistoryText = async (conversationId) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const messages = await Message.findAll({
      where: {
        conversationId: conversationId,
        messageType: "text", 
        createdAt: {
          [Op.gte]: startOfToday, 
        },
      },
      order: [["createdAt", "ASC"]], 
    });

    if (!messages || messages.length === 0) {
      return "Chưa có lịch sử trò chuyện ngày hôm nay.";
    }

    const historyText = messages
      .map((msg) => {
        const sender = msg.senderType === "customer" ? "Khách hàng" : "AI Trợ lý";
        return `${sender}: ${msg.content}`;
      })
      .join("\n");

    return historyText;
  } catch (error) {
    console.error("❌ Lỗi khi cào text lịch sử dưới DB:", error.message);
    return "Chưa có lịch sử trò chuyện ngày hôm nay.";
  }
};
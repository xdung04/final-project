import db from "../models/index.js";

const { Conversation, Message, Customer, Receptionist, User, Sequelize } = db;
const { Op } = Sequelize;

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
    updateData.unreadCount = Sequelize.literal("unread_count + 1");
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
    });
    isNew = true; // 🔥 Đánh dấu mới tạo
  } else if (conversation.status === "closed") {
    await conversation.update({
      status: "waiting",
      mode: "ai",
      assignedReceptionistId: null,
      unreadCount: 0,
    });
    await conversation.reload();
    await saveMessage({
      conversationId: conversation.id,
      senderType: "system",
      messageType: "system",
      eventType: "reopen",
      metadata: {
        timestamp: new Date(),
        message: "Cuộc trò chuyện được mở lại",
      },
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
  const messages = await Message.findAll({
    where: { conversationId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  const conversation = await Conversation.findByPk(conversationId, {
    include: [
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
  });

  return { conversation, messages: messages.reverse() };
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
  if (senderType !== "system" && !senderId)
    throw new Error(`senderId required for ${senderType}`);
  if (messageType === "text" && !content) throw new Error("content required");
  if (messageType === "system" && !eventType)
    throw new Error("eventType required");

  // 🔥 Nếu conversation đang closed và sender là customer → tự động reopen
  const conv = await Conversation.findByPk(conversationId);
  if (conv && conv.status === "closed" && senderType === "customer") {
    await conv.update({
      status: "waiting",
      mode: "ai",
      assignedReceptionistId: null,
      unreadCount: 0,
    });
    // Tạo system message reopen (sẽ được lưu sau khi message chính)
    await Message.create({
      conversationId,
      senderType: "system",
      messageType: "system",
      eventType: "reopen",
      metadata: {
        timestamp: new Date(),
        message: "Cuộc trò chuyện được mở lại",
      },
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

  // Chỉ tăng unread_count nếu tin nhắn từ khách hàng
  const shouldIncreaseUnread = senderType === "customer";
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

  // 🔥 Reset nếu là receptionist được assign HOẶC conversation đang waiting
  // (receptionist có thể đang xem waiting conversation trước khi join)
  const canReset =
    conv.assignedReceptionistId === receptionistId || conv.status === "waiting";

  if (canReset) {
    await Conversation.update(
      { unreadCount: 0 },
      { where: { id: conversationId } },
    );
    return true;
  }
  return false;
};

/**
 * Lễ tân join conversation (có chống tranh chấp)
 */
export const receptionistJoin = async (conversationId, receptionistId) => {
  return await db.sequelize.transaction(async (t) => {
    const conversation = await Conversation.findByPk(conversationId, {
      lock: true,
      transaction: t,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.assignedReceptionistId) {
      throw new Error("Conversation already assigned");
    }

    if (conversation.status === "closed") {
      throw new Error("Conversation is closed");
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

    if (!receptionist) {
      throw new Error("Receptionist not found");
    }

    await conversation.update(
      {
        mode: "human",
        status: "in_progress",
        assignedReceptionistId: receptionistId,
      },
      { transaction: t },
    );

    const systemMessage = await Message.create(
      {
        conversationId,
        senderType: "system",
        messageType: "system",
        eventType: "join",
        metadata: {
          receptionistId,
          name: receptionist.user.fullName,
          email: receptionist.user.email,
          timestamp: new Date(),
        },
      },
      { transaction: t },
    );

    return { conversation, systemMessage, receptionist };
  });
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
  });

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
  // Reset unread cho người nhận? Để nguyên, vì system message là tin mới.
  return { conversation, systemMessage, toReceptionist };
};

/**
 * Đóng conversation
 */
export const closeConversation = async (conversationId) => {
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  await conversation.update({
    status: "closed",
  });

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
    where: { status: "waiting", mode: "ai" },
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

  // format lại cho frontend dễ dùng
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

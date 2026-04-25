// api/src/services/chatLiveService.js
import db from "../models/index.js";

const { Conversation, Message, Customer, Receptionist, User, Sequelize } = db;
const { Op } = Sequelize;

/**
 * Lấy conversation của customer (1-1)
 * Nếu đã closed thì reopen
 */
export const getOrCreateConversation = async (customerId) => {
  // Tìm conversation của customer (kể cả closed)
  let conversation = await Conversation.findOne({
    where: { customerId },
  });

  // Chưa có → tạo mới
  if (!conversation) {
    conversation = await Conversation.create({
      customerId,
      mode: "ai",
      status: "waiting",
    });
  }
  // Đã closed → reopen
  else if (conversation.status === "closed") {
    await conversation.update({
      status: "waiting",
      mode: "ai",
      assignedReceptionistId: null,
    });
    await conversation.reload();

    // Tạo system message thông báo reopen
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
  }

  return conversation;
};

/**
 * Lấy lịch sử chat
 */
export const getConversationHistory = async (
  conversationId,
  limit = 50,
  offset = 0
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

  return {
    conversation,
    messages: messages.reverse(),
  };
};

/**
 * Lưu message
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
  // Validation
  if (senderType !== "system" && !senderId) {
    throw new Error(`senderId is required for senderType: ${senderType}`);
  }

  if (messageType === "text" && !content) {
    throw new Error("content is required for text message");
  }

  if (messageType === "system" && !eventType) {
    throw new Error("eventType is required for system message");
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

  // Update updatedAt để sort conversation
  await Conversation.update(
    { updatedAt: new Date() },
    { where: { id: conversationId } }
  );

  return message;
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
      { transaction: t }
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
      { transaction: t }
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
  toReceptionistId
) => {
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (conversation.assignedReceptionistId !== fromReceptionistId) {
    throw new Error("You are not assigned to this conversation");
  }

  const fromReceptionist = await Receptionist.findByPk(fromReceptionistId, {
    include: [{ model: User, as: "user", attributes: ["fullName"] }],
  });

  const toReceptionist = await Receptionist.findByPk(toReceptionistId, {
    include: [{ model: User, as: "user", attributes: ["fullName"] }],
  });

  if (!toReceptionist) {
    throw new Error("Target receptionist not found");
  }

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

  await conversation.update({
    assignedReceptionistId: toReceptionistId,
  });

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
  const where = {
    status: "in_progress",
  };

  if (receptionistId) {
    where.assignedReceptionistId = receptionistId;
  }

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
 * Waiting conversations (chưa có lễ tân)
 */
export const getWaitingConversations = async () => {
  return await Conversation.findAll({
    where: {
      status: "waiting",
      mode: "ai",
    },
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
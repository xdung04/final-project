// api/src/models/Message.js
"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Conversation, {
        foreignKey: "conversationId",
        as: "conversation",
      });
    }
  }

  Message.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      conversationId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "conversation_id",
      },
      senderType: {
        type: DataTypes.ENUM("customer", "ai", "receptionist", "system"),
        allowNull: false,
        field: "sender_type",
      },
      senderId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "sender_id",
      },
      messageType: {
        type: DataTypes.ENUM("text", "system"),
        defaultValue: "text",
        allowNull: false,
        field: "message_type",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eventType: {
        type: DataTypes.ENUM("join", "leave", "transfer", "reopen"),
        allowNull: true,
        field: "event_type",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Message",
      tableName: "messages",
      timestamps: true,
      underscored: true,
    }
  );

  return Message;
};
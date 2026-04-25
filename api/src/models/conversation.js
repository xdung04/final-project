"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.belongsTo(models.Customer, {
        foreignKey: "customerId",
        targetKey: "idCustomer",
        as: "customer",
      });

      Conversation.belongsTo(models.Receptionist, {
        foreignKey: "assignedReceptionistId",
        as: "assignedReceptionist",
        allowNull: true,
      });

      Conversation.hasMany(models.Message, {
        foreignKey: "conversationId",
        as: "messages",
      });
    }
  }

  Conversation.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      customerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "customer_id",
      },
      mode: {
        type: DataTypes.ENUM("ai", "human"),
        defaultValue: "ai",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("waiting", "in_progress", "closed"),
        defaultValue: "waiting",
        allowNull: false,
      },
      assignedReceptionistId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "assigned_receptionist_id",
      },
      lastMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "last_message",
      },
      unreadCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "unread_count",
      },
    },
    {
      sequelize,
      modelName: "Conversation",
      tableName: "conversations",
      timestamps: true,
      underscored: true,
    }
  );

  return Conversation;
};
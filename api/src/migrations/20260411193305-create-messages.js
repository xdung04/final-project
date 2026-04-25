// api/src/migrations/20250101000011-create-messages.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("messages", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    conversation_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: "conversations",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    sender_type: {
      type: Sequelize.ENUM("customer", "ai", "receptionist", "system"),
      allowNull: false,
    },
    sender_id: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    message_type: {
      type: Sequelize.ENUM("text", "system"),
      defaultValue: "text",
      allowNull: false,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    event_type: {
      type: Sequelize.ENUM("join", "leave", "transfer", "reopen"),
      allowNull: true,
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    },
  });

  // Thêm index để tối ưu query
  await queryInterface.addIndex("messages", ["conversation_id"]);
  await queryInterface.addIndex("messages", ["conversation_id", "created_at"]);
  await queryInterface.addIndex("messages", ["sender_type"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("messages");
}
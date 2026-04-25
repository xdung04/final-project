// api/src/migrations/20250101000010-create-conversations.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("conversations", {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "customers",
        key: "idCustomer",
      },
      unique: true, // 1 customer chỉ có 1 conversation
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    mode: {
      type: Sequelize.ENUM("ai", "human"),
      defaultValue: "ai",
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("waiting", "in_progress", "closed"),
      defaultValue: "waiting",
      allowNull: false,
    },
    assigned_receptionist_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "receptionists",
        key: "idReceptionist",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
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
  await queryInterface.addIndex("conversations", [
    "status",
    "assigned_receptionist_id",
  ]);
  await queryInterface.addIndex("conversations", ["updated_at"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("conversations");
}
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
      unique: true,
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

    // ✅ NEW
    last_message: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    unread_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
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

  // index
  await queryInterface.addIndex("conversations", [
    "status",
    "assigned_receptionist_id",
  ]);

  await queryInterface.addIndex("conversations", ["updated_at"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("conversations");
}
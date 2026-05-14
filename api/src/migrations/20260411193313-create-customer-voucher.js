"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("customer_vouchers", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    voucher_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "vouchers",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    customer_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "customers",
        key: "idCustomer",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    // PENDING_CLAIM đã bỏ — mọi voucher tự động vào kho AVAILABLE
    status: {
      type: Sequelize.ENUM("AVAILABLE", "USED", "EXPIRED"),
      defaultValue: "AVAILABLE",
    },
    issued_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    // null = không hết hạn (NEW_CUSTOMER, POINTS_EXCHANGE khi valid_days = null)
    expires_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    used_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    // Ghi chú nguồn gốc voucher
    // vd: new_customer_welcome | exchanged_200_points | retention_gift | campaign_collect
    source_note: {
      type: Sequelize.STRING,
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
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("customer_vouchers");
}
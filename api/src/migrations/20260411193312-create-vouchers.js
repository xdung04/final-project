"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("vouchers", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    type: {
      type: Sequelize.ENUM(
        "NEW_CUSTOMER",
        "POINTS_EXCHANGE",
        "RETENTION",
        "CAMPAIGN",
      ),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    discount_percent: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    },
    discount_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    max_discount_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    },
    min_invoice_amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    points_required: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    valid_days: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    max_usage_per_customer: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    // CAMPAIGN only
    start_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    total_quantity: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    issued_count: {
      type: Sequelize.INTEGER,
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
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      ),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("vouchers");
}

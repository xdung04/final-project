"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Voucher extends Model {
    static associate(models) {
      Voucher.hasMany(models.CustomerVoucher, {
        foreignKey: "voucher_id",
        as: "customerVouchers",
      });
    }
  }

  Voucher.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          "NEW_CUSTOMER",
          "POINTS_EXCHANGE",
          "RETENTION",
          "CAMPAIGN",
        ),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      discount_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      max_discount_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      min_invoice_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      points_required: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      valid_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      max_usage_per_customer: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      total_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      issued_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Voucher",
      tableName: "vouchers",
      timestamps: true,
      underscored: true,
    },
  );

  return Voucher;
};

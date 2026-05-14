"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class CustomerVoucher extends Model {
    static associate(models) {
      CustomerVoucher.belongsTo(models.Voucher, {
        foreignKey: "voucher_id",
        as: "voucher",
      });
      CustomerVoucher.belongsTo(models.Customer, {
        foreignKey: "customer_id",
        as: "customer",
      });

      CustomerVoucher.hasOne(models.Booking, {
        foreignKey: "idCustomerVoucher",
        as: "booking",
      });
    }
  }

  CustomerVoucher.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      voucher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("AVAILABLE", "USED", "EXPIRED"),
        defaultValue: "AVAILABLE",
      },
      issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      source_note: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CustomerVoucher",
      tableName: "customer_vouchers",
      timestamps: true,
      underscored: true,
    }
  );

  return CustomerVoucher;
};
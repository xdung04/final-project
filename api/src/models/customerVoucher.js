"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class CustomerVoucher extends Model {
    static associate(models) {
      CustomerVoucher.belongsTo(models.Customer, {
        foreignKey: "idCustomer",
        as: "customer",
      });
      CustomerVoucher.belongsTo(models.Voucher, {
        foreignKey: "idVoucher",
        as: "voucher",
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
      idCustomer: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      idVoucher: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      voucherCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      obtainedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("unused", "used", "expired"),
        allowNull: false,
        defaultValue: "unused",
      },
    },
    {
      sequelize,
      modelName: "CustomerVoucher",
      tableName: "customer_voucher",
      timestamps: true,
    }
  );

  return CustomerVoucher;
};

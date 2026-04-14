"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Voucher extends Model {
    static associate(models) {
      Voucher.belongsToMany(models.Customer, {
        through: models.CustomerVoucher,
        foreignKey: "idVoucher",
        otherKey: "idCustomer",
        as: "customers",
      });
      Voucher.hasMany(models.CustomerVoucher, {
      foreignKey: "idVoucher",
      as: "customerVouchers",
    });
    }
  }

  Voucher.init(
    {
      idVoucher: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      discountPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      pointCost: { type: DataTypes.INTEGER, allowNull: false },
      totalQuantity: { type: DataTypes.INTEGER, allowNull: true },
      expiryDate: { type: DataTypes.DATE, allowNull: false },
      status: {                    // Trạng thái voucher
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      description: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: "Voucher",
      tableName: "vouchers",
      timestamps: true,
    }
  );

  return Voucher;
};

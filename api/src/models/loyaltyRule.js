"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class LoyaltyRule extends Model {
    static associate(models) {
      // Nếu sau này có bảng liên quan, ví dụ loyalty_transactions
      // LoyaltyRule.hasMany(models.LoyaltyTransaction, {
      //   foreignKey: "ruleId",
      //   as: "transactions",
      // });
    }
  }

  LoyaltyRule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      money_per_point: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Số tiền (VND) cần để được 1 điểm",
      },
      point_multiplier: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Hệ số nhân điểm (VD: 1.5 = x1.5 điểm)",
      },
      min_order_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Đơn tối thiểu để bắt đầu tính điểm",
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Rule mặc định",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Rule đang hoạt động",
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "LoyaltyRule",
      tableName: "loyalty_rules",
      timestamps: true,
    }
  );

  return LoyaltyRule;
};

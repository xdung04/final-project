"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class CommissionRule extends Model {
    static associate(models) {
      CommissionRule.belongsTo(models.CompensationPlan, {
        foreignKey: "idCompensationPlan",
        as: "plan",
      });
    }
  }

  CommissionRule.init(
    {
      idCommissionRule: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      idCompensationPlan: {
        type: DataTypes.INTEGER,
        allowNull: false,
          field: "idPlan",
      },
      minRevenueStep: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Doanh thu từ mức...",
      },
      maxRevenueStep: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: "Đến mức (null là vô cực)",
      },
      commissionRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        comment: "Phần trăm hoa hồng (VD: 15.00)",
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Độ ưu tiên xử lý luật",
      },
    },
    {
      sequelize,
      modelName: "CommissionRule",
      tableName: "commission_rules",
      timestamps: true,
    }
  );

  return CommissionRule;
};
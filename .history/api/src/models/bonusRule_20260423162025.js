"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class BonusRule extends Model {
    static associate(models) {
      BonusRule.belongsTo(models.CompensationPlan, {
        foreignKey: "idCompensationPlan",
        targetKey:"idCompensationPlan",
        as: "plan",
      });
    }
  }

  BonusRule.init(
    {
      idBonusRule: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
         field: "idBonus",
      },
      idCompensationPlan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "idPlan",
      },
      bonusName: {
        type: DataTypes.STRING(150),
        allowNull: false,
        comment: "Tên gói thưởng (VD: Thưởng chuyên cần & Rating)",
      },
      minCustomerCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Số lượng khách tối thiểu",
      },
      minAverageRating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Rating trung bình tối thiểu (VD: 4.5)",
      },
      rewardAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Số tiền thưởng nóng (VNĐ)",
      },
      evaluationPeriodMonths: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: "BonusRule",
      tableName: "bonus_rules",
      timestamps: true,
    }
  );

  return BonusRule;
};
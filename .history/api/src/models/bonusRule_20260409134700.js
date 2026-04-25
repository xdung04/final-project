"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class BonusRule extends Model {
    static associate(models) {
      // Nếu sau này có bảng liên kết, thêm tại đây
      // Ví dụ:
      // BonusRule.hasMany(models.EmployeeBonus, {
      //   foreignKey: "bonusRuleId",
      //   as: "employeeBonuses",
      // });
    }
  }

  BonusRule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      minRevenue: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: "Doanh thu tối thiểu để đạt mức thưởng này",
      },
      bonusPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: { min: 0, max: 100 },
        comment: "Phần trăm thưởng (VD: 5.00 = 5%)",
      },
      note: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Ghi chú thêm cho quy tắc thưởng",
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Trạng thái kích hoạt quy tắc thưởng",
      },
    },
    {
      sequelize,
      modelName: "BonusRule",
      tableName: "BonusRules",
      timestamps: true,
      indexes: [
        {
          fields: ["minRevenue"],
        },
      ],
    }
  );

  return BonusRule;
};

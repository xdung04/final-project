"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class CompensationPlan extends Model {
    static associate(models) {
      // Một chính sách có nhiều bậc hoa hồng
      CompensationPlan.hasMany(models.CommissionRule, {
        foreignKey: "idCompensationPlan",
        as: "commissionRules",
      });
      // Một chính sách có nhiều quy tắc thưởng KPI
      CompensationPlan.hasMany(models.BonusRule, {
        foreignKey: "idCompensationPlan",
        as: "bonusRules",
      });
      // Một chính sách có thể áp dụng cho nhiều hợp đồng của thợ
      CompensationPlan.hasMany(models.SalaryContract, {
        foreignKey: "idCompensationPlan",
        as: "contracts",
      });
      // Liên kết tới cấp bậc tiếp theo (Lộ trình thăng tiến)
      CompensationPlan.belongsTo(models.CompensationPlan, {
        foreignKey: "idNextPlan",
        as: "nextPlan",
      });
    }
  }

  CompensationPlan.init(
    {
   idCompensationPlan: {
  type: DataTypes.INTEGER,
  primaryKey: true,
  autoIncrement: true,
  field: "idPlan", // 👈 FIX
},
      roleType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "Loại vai trò: junior, senior, master...",
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Tên hiển thị: Thợ Senior, Thợ Cứng...",
      },
      levelOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Thứ tự cấp bậc (để sắp xếp lộ trình)",
      },
      defaultBaseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Lương cứng mặc định cho cấp bậc này",
      },
idNextPlan: {
  type: DataTypes.INTEGER,
  allowNull: true,
  field: "idNextPlan", // 👈 FIX
},
      minRevenueToPromote: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: "Doanh thu cần đạt để thăng cấp",
      },
      evaluationPeriodMonths: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: "Số tháng đánh giá KPI liên tiếp",
      },
      minMonthsInLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Số tháng tối thiểu ở cấp này trước khi thăng cấp",
      },
      effectiveFrom: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Ngày bắt đầu áp dụng chính sách này",
      },
      effectiveTo: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Ngày kết thúc (SCD Type 2)",
      },
    },
    {
      sequelize,
      modelName: "CompensationPlan",
      tableName: "compensation_plans",
      timestamps: true,
    }
  );

  return CompensationPlan;
};
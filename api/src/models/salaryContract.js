"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class SalaryContract extends Model {
    static associate(models) {
      // Liên kết tới thợ cắt tóc
      SalaryContract.belongsTo(models.Barber, {
        foreignKey: "idBarber",
        as: "barber",
      });
      
      SalaryContract.hasMany(models.Salary, {
        foreignKey: "idContract",
        as: "salaries",
      });
      
      // Liên kết tới cấp bậc lương (Plan)
      SalaryContract.belongsTo(models.CompensationPlan, {
        foreignKey: "idCompensationPlan",
        targetKey: "idCompensationPlan", 
        as: "plan",
      });
    }
  }

  SalaryContract.init(
    {
      idSalaryContract: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "idContract", // Khớp với idContract trong migration
      },
     
      idBarber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      idCompensationPlan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "idPlan", // Khớp với idPlan trong migration
      },
      actualBaseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      terminationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        // 🌟 CẬP NHẬT: Thêm "pending" vào ENUM và đặt làm mặc định cho hợp đồng tương lai
        type: DataTypes.ENUM("pending", "active", "closed", "terminated"),
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "SalaryContract",
      tableName: "salary_contracts",
      timestamps: true, // Khớp với việc có createdAt và updatedAt trong migration
    }
  );

  return SalaryContract;
};
"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class SalaryDeduction extends Model {
    static associate(models) {
      // Một khoản khấu trừ thuộc về một phiếu lương
      SalaryDeduction.belongsTo(models.Salary, {
        foreignKey: "idSalary",
        as: "salary",
      });
    }
  }

  SalaryDeduction.init(
    {
      idDeduction: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      idSalary: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleteReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    },
    {
      sequelize,
      modelName: "SalaryDeduction",
      tableName: "salary_deductions",
      timestamps: true,
    }
  );

  return SalaryDeduction;
};
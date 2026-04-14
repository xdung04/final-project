"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Salary extends Model {
    static associate(models) {
      // Liên kết Salary với Barber
      Salary.belongsTo(models.Barber, {
        foreignKey: "idBarber",
        as: "barber",
      });
    }
  }

  Salary.init(
    {
      idSalary: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      idBarber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      baseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      commission: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      tips: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      bonus: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      totalSalary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      status: { // <--- thêm cột status
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Salary",
      tableName: "salaries",
      timestamps: true,
    }
  );

  return Salary;
};

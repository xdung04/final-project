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
      // Liên kết tới cấp bậc hiện tại của hợp đồng
      SalaryContract.belongsTo(models.CompensationPlan, {
        foreignKey: "idCompensationPlan",
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
      },
      idBarber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      idCompensationPlan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "idPlan",
      },
      actualBaseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Lương cứng thực tế thỏa thuận (có thể khác default)",
      },
      contractType: {
        type: DataTypes.ENUM("probation", "full_time", "part_time"),
        defaultValue: "full_time",
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
        type: DataTypes.ENUM("active", "inactive", "terminated"),
        defaultValue: "active",
      },
    },
    {
      sequelize,
      modelName: "SalaryContract",
      tableName: "salary_contracts",
      timestamps: true,
    }
  );

  return SalaryContract;
};
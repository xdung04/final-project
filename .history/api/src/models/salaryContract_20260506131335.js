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
      // Lưu ý: foreignKey ở đây khớp với idBarber/idPlan trong DB
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
        // Giữ DECIMAL(10, 2) theo migration ông gửi
        // (Nếu muốn đổi sang INTEGER thì ông sửa ở cả 2 file nhé)
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
        // Khớp hoàn toàn với ENUM trong migration: active, closed, terminated
        type: DataTypes.ENUM("active", "closed", "terminated"),
        defaultValue: "active",
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
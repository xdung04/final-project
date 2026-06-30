"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class SalaryDeduction extends Model {
    static associate(models) {
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
        comment: "Số tiền khấu trừ",
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Lý do khấu trừ — admin tự ghi chú",
      },
      violationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Ngày xảy ra vi phạm — để đối chiếu khi thợ dispute. Nullable vì tạm ứng không có ngày vi phạm cụ thể",
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Soft delete — null = còn hiệu lực",
      },
      deleteReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Lý do xóa — bắt buộc khi deletedAt != null",
      },
    },
    {
      sequelize,
      modelName: "SalaryDeduction",
      tableName: "salary_deductions",
      timestamps: true,
      paranoid: false,
      scopes: {
        active:      { where: { deletedAt: null } },
        withDeleted: { where: {} },
      },
    }
  );

  return SalaryDeduction;
};
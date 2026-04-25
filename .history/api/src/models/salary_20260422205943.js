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
      // Liên kết 1-Nhiều với bảng Chi tiết Khấu trừ
      Salary.hasMany(models.SalaryDeduction, {
        foreignKey: "idSalary",
        as: "DeductionsList",
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
      month: { type: DataTypes.INTEGER, allowNull: false },
      year: { type: DataTypes.INTEGER, allowNull: false },
      serviceRevenue: { 
        type: DataTypes.DECIMAL(15, 2), // Tôi để 15 cho dư dả doanh thu tiệm lớn
        allowNull: false, 
        defaultValue: 0 
      },
      // --- CÁC KHOẢN THU NHẬP (+) ---
      baseSalary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      commission: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      tips: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      bonus: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      totalSalary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      
      // --- KHẤU TRỪ & THỰC NHẬN ---
      deductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      netSalary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },

      // --- TRẠNG THÁI & WORKFLOW ---
      status: {
        type: DataTypes.ENUM("Draft", "Pending", "Disputed", "Confirmed", "AutoConfirmed", "Paid", "Locked"),
        allowNull: false,
        defaultValue: "Draft",
      },
      disputeReason: { type: DataTypes.TEXT, allowNull: true },
      disputeCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      adjustmentNote: { type: DataTypes.TEXT, allowNull: true },

      // --- TRACKING 48H ---
      sentAt: { type: DataTypes.DATE, allowNull: true },
      deadlineAt: { type: DataTypes.DATE, allowNull: true },

      // --- THANH TOÁN ---
      paidAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      paymentProofUrl: { type: DataTypes.STRING, allowNull: true },
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
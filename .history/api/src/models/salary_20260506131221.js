"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Salary extends Model {
    static associate(models) {
      Salary.belongsTo(models.Barber, {
        foreignKey: "idBarber",
        as: "barber",
      });

      // Include scope "active" mặc định khi join từ Salary
      Salary.hasMany(models.SalaryDeduction, {
        foreignKey: "idSalary",
        as: "DeductionsList",
        scope: { deletedAt: null }, // Chỉ lấy khoản còn hiệu lực
      });

      // Alias riêng nếu cần lấy toàn bộ kể cả đã xóa (dùng cho admin audit)
      Salary.hasMany(models.SalaryDeduction, {
        foreignKey: "idSalary",
        as: "DeductionsAll",
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
            idContract: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
      idBarber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: { type: DataTypes.INTEGER, allowNull: false },
      year:  { type: DataTypes.INTEGER, allowNull: false },

      // ── Doanh thu ─────────────────────────────────────────────────────────
      serviceRevenue: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Tổng doanh thu dịch vụ thợ tạo ra trong tháng",
      },

      // ── Thu nhập (+) ──────────────────────────────────────────────────────
      baseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Lương cơ bản",
      },
      commission: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Hoa hồng theo doanh thu",
      },
      tips: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Tổng tip khách cho trong tháng",
      },
      bonus: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Thưởng KPI / thưởng thêm",
      },
      totalSalary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Cached: baseSalary + commission + tips + bonus",
      },

calculationType: {
  type: DataTypes.ENUM("MONTHLY", "SETTLEMENT"),
  allowNull: false,
  defaultValue: "MONTHLY",
},
daysWorked: {
  type: DataTypes.INTEGER,
  allowNull: true,
  comment: "Chi dung cho SETTLEMENT",
},
      // ── Khấu trừ & Thực nhận ──────────────────────────────────────────────
      deductions: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Cached: SUM(salary_deductions.amount) where deletedAt IS NULL — tự động cập nhật khi thêm/xóa deduction",
      },
      netSalary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Cached: totalSalary - deductions — tự động cập nhật khi thêm/xóa deduction",
      },

      // ── Workflow ──────────────────────────────────────────────────────────
      status: {
        type: DataTypes.ENUM(
          "Draft",
          "Pending",
          "Disputed",
          "Confirmed",
          "AutoConfirmed",
          "Paid",
          "Locked"
        ),
        allowNull: false,
        defaultValue: "Draft",
      },
      disputeReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Lý do thợ khiếu nại — lần hiện tại",
      },
      disputeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Số lần đã khiếu nại — tối đa 2",
      },

      // ── Tracking 48h deadline ─────────────────────────────────────────────
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Thời điểm gửi phiếu cho thợ",
      },
      deadlineAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Deadline xác nhận = sentAt + 48h",
      },

      // ── Thanh toán ────────────────────────────────────────────────────────
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Số tiền thực tế đã trả (có thể trả một phần)",
      },
      paymentProofUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Mã giao dịch hoặc URL bill chuyển khoản",
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
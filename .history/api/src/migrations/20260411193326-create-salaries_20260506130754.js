"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("salaries", {
    idSalary: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idBarber: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "barbers", key: "idBarber" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    // ── Thêm mới theo Guideline V9 ────────────────────────────────────────
    idContract: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "salary_contracts", key: "idContract" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "FK → salary_contracts. Biết lương tháng này dùng HĐ nào",
    },
    calculationType: {
      type: Sequelize.ENUM("MONTHLY", "SETTLEMENT"),
      allowNull: false,
      defaultValue: "MONTHLY",
      comment: "MONTHLY = lương thường | SETTLEMENT = quyết toán nghỉ việc",
    },
    daysWorked: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Số ngày làm thực tế — chỉ dùng cho SETTLEMENT",
    },
    // ─────────────────────────────────────────────────────────────────────

    month: { type: Sequelize.INTEGER, allowNull: false },
    year:  { type: Sequelize.INTEGER, allowNull: false },

    // ── Doanh thu gốc ─────────────────────────────────────────────────────
    serviceRevenue: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // ── Thu nhập (+) ──────────────────────────────────────────────────────
    baseSalary:  { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    commission:  { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    tips:        { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    bonus:       { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalSalary: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

    // ── Khấu trừ & Thực nhận ──────────────────────────────────────────────
    deductions: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    netSalary:  { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

    // ── Workflow ──────────────────────────────────────────────────────────
    status: {
      type: Sequelize.ENUM("Draft", "Pending", "Disputed", "Confirmed", "AutoConfirmed", "Paid", "Locked"),
      allowNull: false,
      defaultValue: "Draft",
    },
    disputeReason: { type: Sequelize.TEXT,    allowNull: true },
    disputeCount:  { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },

    // ── Tracking 48h ──────────────────────────────────────────────────────
    sentAt:     { type: Sequelize.DATE, allowNull: true },
    deadlineAt: { type: Sequelize.DATE, allowNull: true },

    // ── Thanh toán ────────────────────────────────────────────────────────
    paidAmount:      { type: Sequelize.DECIMAL(10, 2), allowNull: true },
    paymentProofUrl: { type: Sequelize.STRING,         allowNull: true },

    // ── Timestamps ────────────────────────────────────────────────────────
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("salaries");
}
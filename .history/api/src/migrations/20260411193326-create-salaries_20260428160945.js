// api/src/migrations/20250101000013-create-salaries.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("salaries", {
    idSalary: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    idBarber: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "barbers", key: "idBarber" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    month: { type: Sequelize.INTEGER, allowNull: false },
    year: { type: Sequelize.INTEGER, allowNull: false },
    // --- DỮ LIỆU ĐỐI SOÁT GỐC ---
    serviceRevenue: { 
      type: Sequelize.DECIMAL(15, 2), // Dùng 15 cho chắc nếu tiệm đông khách
      allowNull: false, 
      defaultValue: 0 
    },
    
    // --- CÁC KHOẢN THU NHẬP (+) ---
    baseSalary: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    commission: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    tips: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    bonus: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalSalary: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }, 

    // --- CÁC KHOẢN KHẤU TRỪ & THỰC NHẬN (MỚI) ---
    deductions: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }, 
    netSalary: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },  

    // --- TRẠNG THÁI & WORKFLOW (MỚI) ---
    status: { 
      type: Sequelize.ENUM("Draft", "Pending", "Disputed", "Confirmed", "AutoConfirmed", "Paid", "Locked"), 
      allowNull: false, 
      defaultValue: "Draft" 
    },
    disputeReason: { type: Sequelize.TEXT, allowNull: true },
    disputeCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },

    // --- TRACKING THỜI GIAN 48H (MỚI) ---
    sentAt: { type: Sequelize.DATE, allowNull: true },
    deadlineAt: { type: Sequelize.DATE, allowNull: true },

    // --- THANH TOÁN (MỚI) ---
    paidAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
    paymentProofUrl: { type: Sequelize.STRING, allowNull: true },

    // --- TIMESTAMPS ---
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("salaries");
}
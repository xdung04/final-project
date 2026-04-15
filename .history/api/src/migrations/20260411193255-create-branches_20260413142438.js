"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("branches", {
    idBranch: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING(100), allowNull: false },
    address: { type: Sequelize.STRING, allowNull: true },
    
    // Thêm 2 trường này vào đây
    latitude: { 
      type: Sequelize.DECIMAL(10, 8), 
      allowNull: true,
      comment: "Vĩ độ" 
    },
    longitude: { 
      type: Sequelize.DECIMAL(11, 8), 
      allowNull: true,
      comment: "Kinh độ" 
    },

    openTime: { type: Sequelize.TIME, allowNull: false },
    closeTime: { type: Sequelize.TIME, allowNull: false },
    slotDuration: { type: Sequelize.INTEGER, allowNull: false },
    status: { type: Sequelize.ENUM("Active", "Inactive"), defaultValue: "Active" },
    suspendDate: { type: Sequelize.DATEONLY, allowNull: true },
    resumeDate: { type: Sequelize.DATEONLY, allowNull: true },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("branches");
}
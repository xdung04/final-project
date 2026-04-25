// api/src/migrations/20250101000025-create-notifications.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("notifications", {
    idNotification: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    
    // Thêm loại "SYSTEM" để dự phòng các thông báo hệ thống chung sau này
    type: { type: Sequelize.ENUM("BOOKING", "SALARY", "SYSTEM"), allowNull: false }, 
    
    title: { type: Sequelize.STRING(255), allowNull: false },
    content: { type: Sequelize.TEXT, allowNull: true },
    
    // BỔ SUNG "admin" ĐỂ THỢ CÓ THỂ GỬI KHIẾU NẠI LÊN QUẢN LÝ
    targetRole: { type: Sequelize.ENUM("customer", "barber", "admin"), allowNull: false }, 
    targetId: { type: Sequelize.INTEGER, allowNull: true }, // ID của User/Barber/Admin nhận
    
    // BỔ SUNG CỘT CHUYỂN HƯỚNG (DEEP-LINK)
    // Lưu idSalary hoặc idBooking để click vào Noti là mở đúng record đó ra
    referenceId: { type: Sequelize.INTEGER, allowNull: true }, 

    isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
    
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("notifications");
}
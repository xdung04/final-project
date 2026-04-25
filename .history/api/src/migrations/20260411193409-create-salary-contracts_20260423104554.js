"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("salary_contracts", {
   idContract: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
   idBarber: { 
      type: Sequelize.INTEGER, 
      allowNull: false,
      // TODO: Thay "barbers" và "idBarber" bằng tên bảng / ID thực tế của ông
      references: { model: "barbers", key: "idBarber" },
      onDelete: "CASCADE"
    },
    idPlan: { 
      type: Sequelize.INTEGER, 
      allowNull: false,
      references: { model: "compensation_plans", key: "idPlan" },
      onDelete: "RESTRICT" // Đang có hợp đồng thì không cho xóa plan này
    },
    actualBaseSalary: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    contractType: { 
      type: Sequelize.ENUM("probation", "full_time", "part_time"), 
      defaultValue: "full_time" 
    },
    startDate: { type: Sequelize.DATEONLY, allowNull: false },
    endDate: { type: Sequelize.DATEONLY, allowNull: true },
    status: { 
      type: Sequelize.ENUM("active", "inactive", "terminated"), 
      defaultValue: "active" 
    },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("salary_contracts");
}
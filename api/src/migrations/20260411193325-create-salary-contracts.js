"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("salary_contracts", {
    idContract: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idBarber: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "barbers", key: "idBarber" },
      onDelete: "CASCADE",
    },
    idPlan: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "compensation_plans", key: "idPlan" },
      onDelete: "RESTRICT",
    },
    actualBaseSalary: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      comment: "Bat buoc = ngay 01 hang thang",
    },
    endDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: "Null = vo thoi han. Chi set khi barber nghi viec hoac len cap",
    },
    status: {
      type: Sequelize.ENUM("active", "closed", "terminated"),
      defaultValue: "active",
      comment: "active = dang chay | closed = dong do len cap | terminated = nghi viec",
    },
    terminationReason: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Ly do cham dut HD - admin nhap khi quyet toan",
    },
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
  await queryInterface.dropTable("salary_contracts");
}
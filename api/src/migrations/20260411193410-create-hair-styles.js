"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("hairstyles", {
    idHairstyle: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    
    idCategory: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "categories", // Tên bảng mục tiêu (viết thường, số nhiều)
        key: "idCategory",   // Tên cột khóa chính của bảng mục tiêu
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    name: { type: Sequelize.STRING(100), allowNull: false },
    slug: { type: Sequelize.STRING, allowNull: false, unique: true }, // Slug định danh cho kiểu tóc
    shortDescription: { type: Sequelize.TEXT, allowNull: true },
    difficultyLevel: { type: Sequelize.STRING(50), allowNull: true },
    maintenanceLevel: { type: Sequelize.STRING(50), allowNull: true },
    suitableAge: { type: Sequelize.STRING(50), allowNull: true },
    status: { type: Sequelize.ENUM("Active", "Inactive"), defaultValue: "Active" },
    coverImage: { type: Sequelize.TEXT, allowNull: true },
    sideImage: { type: Sequelize.TEXT, allowNull: true },
    
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  });
  await queryInterface.addIndex("hairstyles", ["idCategory"]);
  await queryInterface.addIndex("hairstyles", ["status"]);
  await queryInterface.addIndex("hairstyles", ["difficultyLevel"]);
}


export async function down(queryInterface) {
  await queryInterface.dropTable("hairstyles");
}
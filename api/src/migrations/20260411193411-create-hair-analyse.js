"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("hair_analyses", {
    idAnalysis: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "customers", key: "idCustomer" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    faceShape: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    skinToneUndertone: {
      type: Sequelize.STRING(20),
      allowNull: true,
    },
    skinType: {
      type: Sequelize.STRING(30),
      allowNull: true,
    },
    selectedHairstyleName: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    lastAnalysisAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    rating: {
      type: Sequelize.TINYINT,      // 1-5 sao
      allowNull: true,
    },
    feedback: {
      type: Sequelize.STRING(255),  // "Gợi ý rất phù hợp!"
      allowNull: true,
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
  await queryInterface.dropTable("hair_analyses");
}
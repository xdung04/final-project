"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("users", {
    idUser: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
    },
    password: {
      type: Sequelize.STRING(255),
      allowNull: true, // Cho phép null cho OAuth
    },
    fullName: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    phoneNumber: {
      type: Sequelize.STRING(20),
      allowNull: true, // Cho phép null cho OAuth
      unique: true,
    },
    googleId: {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    },
    authProvider: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "local",
    },
    isStatus: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    image: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    role: {
      type: Sequelize.ENUM("customer", "barber", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("users");
}
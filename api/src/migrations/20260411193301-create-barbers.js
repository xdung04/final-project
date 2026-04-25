"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("barbers", {
    idBarber: {
      type: Sequelize.INTEGER,
      primaryKey: true,

      // 🔥 đây là cái QUAN TRỌNG NHẤT
      references: {
        model: "users",
        key: "idUser",
      },

      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    idBranch: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "branches",
        key: "idBranch",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    profileDescription: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    experienceYears: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    specialty: Sequelize.STRING(255),
    style: Sequelize.STRING(255),
    certificates: Sequelize.TEXT,
    philosophy: Sequelize.TEXT,

    isLocked: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },

    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },

    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("barbers");
}
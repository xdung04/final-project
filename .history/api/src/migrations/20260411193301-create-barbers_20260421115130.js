"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("barbers", {
    
    // ✅ PK = FK luôn
    idBarber: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "users",
        key: "idUser",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    idBranch: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: "branches",
        },
        key: "idBranch",
      },
      onDelete: "CASCADE",
    },

    profileDescription: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    isLocked: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    experienceYears: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    specialty: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    style: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    certificates: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    philosophy: {
      type: Sequelize.TEXT,
      allowNull: true,
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

export async function down(queryInterface) {
  await queryInterface.dropTable("barbers");
}
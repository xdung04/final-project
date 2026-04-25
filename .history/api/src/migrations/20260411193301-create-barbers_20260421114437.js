"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("barbers", {
    idBarber: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    idUser: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: "users",
        },
        key: "idUser",
      },
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

    // 👇 GỘP LUÔN CÁC FIELD CỦA FILE CŨ
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
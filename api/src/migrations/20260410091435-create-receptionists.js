"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("receptionists", {
      idReceptionist: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,

        // PK = FK tới users
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
        unique: true, // mỗi branch chỉ có 1 receptionist

        references: {
          model: "branches",
          key: "idBranch",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("receptionists");
  },
};

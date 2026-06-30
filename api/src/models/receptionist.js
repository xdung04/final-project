"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Receptionist extends Model {
    static associate(models) {
      // 1-1 với User
      Receptionist.belongsTo(models.User, {
        foreignKey: "idReceptionist",
        as: "user",
      });

      // 1-1 với Branch
      Receptionist.belongsTo(models.Branch, {
        foreignKey: "idBranch",
        as: "branch",
      });
      Receptionist.hasMany(models.Conversation, {
        foreignKey: "assignedReceptionistId",
        as: "assignedConversations",
      });
    }
  }

  Receptionist.init(
    {
      idReceptionist: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },

      idBranch: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // 👉 đảm bảo mỗi Branch chỉ có 1 Receptionist
      },
    },
    {
      sequelize,
      modelName: "Receptionist",
      tableName: "receptionists",
      timestamps: true,
    },
  );

  return Receptionist;
};

"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: "targetId",
        constraints: false,
        as: "user",
      });
    }
  }

  Notification.init(
    {
      idNotification: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      type: {
        type: DataTypes.ENUM("BOOKING", "SALARY"),
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      targetRole: {
        type: DataTypes.ENUM("customer", "barber"),
        allowNull: false,
      },

      targetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Notification",
      tableName: "notifications",
    }
  );

  return Notification;
};

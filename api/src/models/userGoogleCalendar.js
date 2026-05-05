"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class UserGoogleCalendar extends Model {
    static associate(models) {
      UserGoogleCalendar.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  UserGoogleCalendar.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "userId",
      },
      googleEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "googleEmail",
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "accessToken",
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "refreshToken",
      },
      expiry: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "expiry",
      },
    },
    {
      sequelize,
      modelName: "UserGoogleCalendar",
      tableName: "UserGoogleCalendars",
      timestamps: true,
      underscored: false,
    }
  );

  return UserGoogleCalendar;
};
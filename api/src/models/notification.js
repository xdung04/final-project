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
        type: DataTypes.ENUM("BOOKING", "SALARY", "SYSTEM"), // Thêm SYSTEM dự phòng
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
        type: DataTypes.ENUM("customer", "barber", "admin","receptionist"), // Bổ sung admin
        allowNull: false,
      },
      targetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      referenceId: { // Bổ sung id tham chiếu (vd: idSalary, idBooking)
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
      timestamps: true, // Thêm timestamps nếu migration của ông có createdAt/updatedAt
    }
  );

  return Notification;
};
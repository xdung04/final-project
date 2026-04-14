// models/BookingTip.js
"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class BookingTip extends Model {
    static associate(models) {
      BookingTip.belongsTo(models.Booking, {
        foreignKey: "idBooking",
        as: "booking",
      });
      BookingTip.belongsTo(models.Barber, {
        foreignKey: "idBarber",
        as: "barber",
      });
    }
  }

  BookingTip.init(
    {
      idTip: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      idBooking: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      idBarber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "BookingTip",
      tableName: "booking_tips",
      timestamps: true,
    }
  );

  return BookingTip;
};

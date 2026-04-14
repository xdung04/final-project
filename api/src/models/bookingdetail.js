"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class BookingDetail extends Model {
    static associate(models) {
      // BookingDetail thuộc về Booking
      BookingDetail.belongsTo(models.Booking, { foreignKey: "idBooking", as: "booking" });
      // BookingDetail thuộc về Service
      BookingDetail.belongsTo(models.Service, {
        foreignKey: "idService",
        as: "service",
      });

    }
  }

  BookingDetail.init(
    {
      idBookingDetail: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      idBooking: DataTypes.INTEGER,
      idService: DataTypes.INTEGER,
      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BookingDetail",
      tableName: "booking_details",
    }
  );

  return BookingDetail;
};

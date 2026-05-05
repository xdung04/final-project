"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.Customer, { foreignKey: "idCustomer" });
      Booking.belongsTo(models.Barber, { foreignKey: "idBarber", as: "barber" });
      Booking.belongsTo(models.CustomerVoucher, { foreignKey: "idCustomerVoucher" });
      Booking.hasMany(models.BookingDetail, { foreignKey: "idBooking" });
      Booking.hasOne(models.BookingTip, { foreignKey: "idBooking", as: "BookingTip" });
    }
  }

  Booking.init(
    {
      idBooking: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      idCustomer: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      idBarber: DataTypes.INTEGER,
      idCustomerVoucher: DataTypes.INTEGER,
      guestCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      bookingDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      bookingTime: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
     status: {
      type: DataTypes.ENUM("Pending", "InProgress", "Completed", "Cancelled"),
      defaultValue: "Pending",
    },

      description: DataTypes.TEXT,

      // 💰 Tổng tiền booking
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      // 💳 Thanh toán: true = đã thanh toán, false = chưa thanh toán
      isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Booking",
      tableName: "bookings",
    }
  );

  return Booking;
};

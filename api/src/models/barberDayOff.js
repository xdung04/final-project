"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class BarberDayOff extends Model {
    static associate(models) {
      BarberDayOff.belongsTo(models.Barber, { foreignKey: "idBarber" });
    }
  }
  BarberDayOff.init(
    {
      idUnavailable: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      idBarber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

      reason: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "BarberDayOff",
      tableName: "barber_day_offs",
      timestamps: true,
    }
  );
  return BarberDayOff;
};

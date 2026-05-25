"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Barber extends Model {
    static associate(models) {
      Barber.belongsTo(models.User, { foreignKey: "idBarber", targetKey:  "idUser",as: "user" });
      Barber.belongsTo(models.Branch, { foreignKey: "idBranch", as: "branch" });
      Barber.hasMany(models.Booking, { foreignKey: "idBarber", as: "Bookings" });
      Barber.hasMany(models.Salary, { foreignKey: "idBarber", as: "salaries" });
      Barber.hasOne(models.BarberRatingSummary, { foreignKey: "idBarber", as: "ratingSummary" });
      Barber.hasMany(models.SalaryContract, {
        foreignKey: "idBarber",
        as: "contracts",
      });
    }
  }

  Barber.init(
    {
      idBarber: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      idBranch: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      profileDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      experienceYears: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      specialty: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      style: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      certificates: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      philosophy: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // ─── NEW ──────────────────────────────────────────────────────────
      lockDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: "Scheduled lock date. Cron sets isLocked=true when today >= lockDate.",
      },
      // ──────────────────────────────────────────────────────────────────
    },
    {
      sequelize,
      modelName: "Barber",
      tableName: "barbers",
      timestamps: true,
    },
  );

  return Barber;
};

"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Barber extends Model {
    static associate(models) {
      Barber.belongsTo(models.User, { foreignKey: "idBarber", as: "user" });
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

      // ── Các field mới ──
      experienceYears: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "Số năm kinh nghiệm",
      },
      specialty: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Chuyên môn chính (VD: Fade, Nhuộm, Uốn...)",
      },
      style: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Phong cách làm việc (VD: Hiện đại, Cổ điển...)",
      },
      certificates: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      philosophy: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Triết lý làm nghề",
      },
      // ── Hết field mới ──

      isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
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

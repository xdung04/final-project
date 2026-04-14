"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class BarberRatingSummary extends Model {
    static associate(models) {
      BarberRatingSummary.belongsTo(models.Barber, {
        foreignKey: "idBarber",
        as: "barber",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  BarberRatingSummary.init(
    {
      idBarber: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: "barbers", key: "idBarber" },
        allowNull: false,
      },
      totalRate: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      avgRate: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "BarberRatingSummary",
      tableName: "barber_rating_summaries",
      timestamps: false, // bỏ createdAt, updatedAt
    }
  );

  return BarberRatingSummary;
};

"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Quan hệ 1-1 với Customer
      User.hasOne(models.Customer, {
        foreignKey: "idCustomer",
        as: "customer",
      });

      // Quan hệ 1-1 với Barber
      User.hasOne(models.Barber, {
        foreignKey: "idBarber",
        as: "barber",
      });

      // Quan hệ 1-1 với Receptionist
      User.hasOne(models.Receptionist, {
        foreignKey: "idReceptionist",
        as: "receptionist",
      });
    }
  }
  User.init(
    {
      idUser: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "phoneNumber", // map với DB
      },
      isStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("customer", "barber", "admin", "receptionist"),
        allowNull: false,
        defaultValue: "customer",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
    },
  );

  return User;
};

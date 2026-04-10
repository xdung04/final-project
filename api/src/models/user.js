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
        allowNull: true, // Đổi thành true vì Google Login không có mật khẩu
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true, // Đổi thành true vì Google không phải lúc nào cũng trả về số điện thoại
        unique: true,
        field: "phoneNumber",
      },
      googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true, // ID từ Google là duy nhất
      },
      authProvider: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "local", // 'local' hoặc 'google'
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
        type: DataTypes.ENUM("customer", "barber", "admin"),
        allowNull: false,
        defaultValue: "customer",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
    }
  );

  return User;
};
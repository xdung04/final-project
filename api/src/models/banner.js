"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Banner extends Model {
    static associate(models) {
      Banner.belongsTo(models.User, {
        foreignKey: "createdBy",
        as: "creator",
      });
    }
  }

  Banner.init(
    {
      idBanner: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      title: {
        type: DataTypes.STRING(255),
      },

      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      linkUrl: {
        type: DataTypes.STRING,
      },

      startAt: {
        type: DataTypes.DATE,
      },

      endAt: {
        type: DataTypes.DATE,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Banner",
      tableName: "banners",
    }
  );

  return Banner;
};

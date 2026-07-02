"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Hairstyle extends Model {
    static associate(models) {
      Hairstyle.belongsTo(models.Category, {
        foreignKey: "idCategory",
        as: "category",
      });
    }
  }

  Hairstyle.init(
    {
      idHairstyle: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      idCategory: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      shortDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      difficultyLevel: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      maintenanceLevel: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      suitableAge: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      suitableFaceShapes: {
        type: DataTypes.JSON,  // ["oval", "round", "square", "heart", "oblong"]
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
      },
      coverImage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sideImage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Hairstyle",
      tableName: "hairstyles",
    }
  );

  return Hairstyle;
};
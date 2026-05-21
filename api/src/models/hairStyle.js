"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Hairstyle extends Model {
    static associate(models) {
      // Một kiểu tóc thuộc về MỘT danh mục (Khóa ngoại idCategory nằm ở đây)
      Hairstyle.belongsTo(models.Category, {
        foreignKey: "idCategory",
        as: "category", // Alias để sau này dùng: Hairstyle.findAll({ include: 'category' })
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
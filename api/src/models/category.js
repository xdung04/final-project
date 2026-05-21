"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // Một danh mục có NHIỀU kiểu tóc
      Category.hasMany(models.Hairstyle, {
        foreignKey: "idCategory",
        as: "hairstyles", // Alias để sau này dùng: Category.findAll({ include: 'hairstyles' })
      });
    }
  }

  Category.init(
    {
      idCategory: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
      },
    },
    {
      sequelize,
      modelName: "Category",
      tableName: "categories",
    }
  );

  return Category;
};
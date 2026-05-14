"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class News extends Model {
    static associate(models) {
      // Sau này nếu cần liên kết với User (người đăng)
      // News.belongsTo(models.User, { foreignKey: "createdBy", as: "author" });
    }
  }

  News.init(
    {
      idNews: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM("NEWS", "PROMOTION", "STYLE"),
        defaultValue: "NEWS",
      },
      status: {
        type: DataTypes.ENUM("DRAFT", "PUBLISHED"),
        defaultValue: "DRAFT",
      },
    },
    {
      sequelize,
      modelName: "News",
      tableName: "news",
    }
  );

  return News;
};
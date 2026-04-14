"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Hashtag extends Model {
    static associate(models) {
      // Quan hệ N-N với Reel
      Hashtag.belongsToMany(models.Reel, {
        through: models.ReelHashtag,
        foreignKey: "idHashtag",
        otherKey: "idReel",
      });
    }
  }

  Hashtag.init(
    {
      idHashtag: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Hashtag",
      tableName: "hashtags",
    }
  );

  return Hashtag;
};

"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ReelHashtag extends Model {
    static associate(models) {
      ReelHashtag.belongsTo(models.Reel, { foreignKey: "idReel" });
      ReelHashtag.belongsTo(models.Hashtag, { foreignKey: "idHashtag" });
    }
  }

  ReelHashtag.init(
    {
      idReel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "reels",
          key: "idReel",
        },
        onDelete: "CASCADE",
      },
      idHashtag: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "hashtags",
          key: "idHashtag",
        },
        onDelete: "CASCADE",
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ReelHashtag",
      tableName: "reel_hashtags",
      timestamps: false,
    }
  );

  return ReelHashtag;
};

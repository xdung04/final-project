"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ReelView extends Model {
    static associate(models) {
      ReelView.belongsTo(models.Reel, { foreignKey: "idReel" });
      ReelView.belongsTo(models.User, { foreignKey: "idUser" });
    }
  }
  ReelView.init(
    {
      idReel: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      idUser: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      lastViewedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ReelView",
      tableName: "reel_views",
      timestamps: false,
    }
  );
  return ReelView;
};
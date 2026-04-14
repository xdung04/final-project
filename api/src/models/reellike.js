"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ReelLike extends Model {
    static associate(models) {
      ReelLike.belongsTo(models.Reel, { foreignKey: "idReel" });
      ReelLike.belongsTo(models.User, { foreignKey: "idUser" });
    }
  }
  ReelLike.init(
    {
      idLike: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      idReel: DataTypes.INTEGER,
      idUser: DataTypes.INTEGER,
    },
    { sequelize, modelName: "ReelLike", tableName: "reel_likes" }
  );
  return ReelLike;
};

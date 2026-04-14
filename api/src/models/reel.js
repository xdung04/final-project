"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Reel extends Model {
    static associate(models) {
      Reel.belongsTo(models.Barber, { foreignKey: "idBarber" });
      Reel.hasMany(models.ReelComment, { foreignKey: "idReel" });
      Reel.hasMany(models.ReelLike, { foreignKey: "idReel" });
      Reel.hasMany(models.ReelView, { foreignKey: "idReel" });
      Reel.belongsToMany(models.Hashtag, {
        through: "reel_hashtags",
        foreignKey: "idReel",
        otherKey: "idHashtag",
      });
    }
  }
  Reel.init(
    {
      idReel: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      idBarber: DataTypes.INTEGER,
      title: DataTypes.STRING,
      url: DataTypes.STRING,
      thumbnail: DataTypes.STRING,
      description: DataTypes.TEXT,
      createdAt: DataTypes.DATE,
    },
    { sequelize, modelName: "Reel", tableName: "reels" }
  );
  return Reel;
};
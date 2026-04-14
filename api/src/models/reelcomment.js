"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ReelComment extends Model {
    static associate(models) {
      ReelComment.belongsTo(models.Reel, { foreignKey: "idReel" });
      ReelComment.belongsTo(models.User, { foreignKey: "idUser" });
      ReelComment.hasMany(models.ReelComment, {
        foreignKey: "parentCommentId",
        as: "replies",
      });
      ReelComment.belongsTo(models.ReelComment, {
        foreignKey: "parentCommentId",
        as: "parent",
      });
      }
  }
  ReelComment.init(
    {
      idComment: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      idReel: DataTypes.INTEGER,
      idUser: DataTypes.INTEGER,
      parentCommentId: DataTypes.INTEGER,
      content: DataTypes.TEXT,
    },
    { sequelize, modelName: "ReelComment", tableName: "reel_comments" }
  );
  return ReelComment;
};

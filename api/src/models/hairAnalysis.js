"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class HairAnalysis extends Model {
    static associate(models) {
      HairAnalysis.belongsTo(models.Customer, {
        foreignKey: "customerId",
        targetKey: "idCustomer",
        as: "customer",
      });
    }
  }

  HairAnalysis.init(
    {
      idAnalysis: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      faceShape: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      skinToneUndertone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      skinType: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      selectedHairstyleName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      lastAnalysisAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rating: {
        type: DataTypes.TINYINT,     // 1-5 sao
        allowNull: true,
        validate: { min: 1, max: 5 },
      },
      feedback: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "HairAnalysis",
      tableName: "hair_analyses",
      timestamps: true,
    }
  );

  return HairAnalysis;
};
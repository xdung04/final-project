"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class CustomerGallery extends Model {
    static associate(models) {
      CustomerGallery.belongsTo(models.Booking, { foreignKey: "idBooking" });
      CustomerGallery.belongsTo(models.Barber, { foreignKey: "uploadBy" });
    }
  }
  CustomerGallery.init(
    {
      idImage: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      idBooking: DataTypes.INTEGER,
      uploadBy: DataTypes.INTEGER,
      imageUrl: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    { sequelize, modelName: "CustomerGallery", tableName: "customer_galleries" }
  );
  return CustomerGallery;
};

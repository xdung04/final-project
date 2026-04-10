"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Branch extends Model {
    static associate(models) {
      this.hasMany(models.ServiceAssignment, { foreignKey: "idBranch", as: "serviceAssignments" });
      this.hasMany(models.Barber, { foreignKey: "idBranch", as: "barbers" });

      this.belongsToMany(models.Service, {
        through: models.ServiceAssignment,
        foreignKey: "idBranch",
        otherKey: "idService",
        as: "services",
      });

      this.hasOne(models.Receptionist, {
        foreignKey: "idBranch",
        as: "receptionist",
      });
    }
  }

  Branch.init(
    {
      idBranch: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: DataTypes.STRING,
      address: DataTypes.STRING,

      openTime: DataTypes.TIME,
      closeTime: DataTypes.TIME,

      status: DataTypes.ENUM("Active", "Inactive"),
      slotDuration: DataTypes.INTEGER,

      // dùng DATEONLY để tránh timezone tự chỉnh giờ
      suspendDate: { type: DataTypes.DATEONLY, allowNull: true },
      resumeDate: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      sequelize,
      modelName: "Branch",
      tableName: "branches",
    },
  );

  return Branch;
};

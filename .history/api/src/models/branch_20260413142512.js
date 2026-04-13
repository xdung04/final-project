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

      // --- THÊM 2 TRƯỜNG TỌA ĐỘ VÀO ĐÂY ---
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        validate: {
          min: -90,
          max: 90
        }
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        validate: {
          min: -180,
          max: 180
        }
      },
      // ------------------------------------

      openTime: DataTypes.TIME,
      closeTime: DataTypes.TIME,

      status: DataTypes.ENUM("Active", "Inactive"),
      slotDuration: DataTypes.INTEGER,

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
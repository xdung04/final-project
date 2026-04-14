"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ServiceAssignment extends Model {
    static associate(models) {
      this.belongsTo(models.Branch, { foreignKey: "idBranch", as: "branch" });
      this.belongsTo(models.Service, { foreignKey: "idService", as: "service" });
    }
  }

  ServiceAssignment.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      idBranch: DataTypes.INTEGER,
      idService: DataTypes.INTEGER,
    },
    { sequelize, modelName: "ServiceAssignment", tableName: "service_assignments" }
  );
  return ServiceAssignment;
};

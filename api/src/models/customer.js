"use strict";
import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Customer extends Model {
    static associate(models) {
      Customer.belongsTo(models.User, {
        foreignKey: "idCustomer",
         targetKey:  "idUser", 
        as: "user",

      });
      Customer.hasMany(models.HairAnalysis, {
  foreignKey: "customerId",
  sourceKey: "idCustomer",
  as: "hairAnalyses",
});
      Customer.belongsToMany(models.Voucher, {
        through: models.CustomerVoucher,
        foreignKey: "customer_id",  
        otherKey: "voucher_id",      
        as: "vouchers",
      });

      Customer.hasOne(models.Conversation, {
        foreignKey: "customerId",
        sourceKey: "idCustomer",
        as: "conversation",
      });
    }
  }

  Customer.init(
    {
      idCustomer: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      loyaltyPoint: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Customer",
      tableName: "customers",
      timestamps: true,
    },
  );

  return Customer;
};

"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY role ENUM('customer', 'barber', 'admin', 'receptionist') NOT NULL DEFAULT 'customer';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY role ENUM('customer', 'barber', 'admin') NOT NULL DEFAULT 'customer';
    `);
  },
};

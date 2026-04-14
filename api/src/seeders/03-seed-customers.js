"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("customers", [
    {
      idCustomer: 2,
      loyaltyPoint: 150,
      address: "12 Lê Lợi, Q1, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 3,
      loyaltyPoint: 80,
      address: "34 Hai Bà Trưng, Q3, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 4,
      loyaltyPoint: 200,
      address: "56 Nguyễn Trãi, Q5, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 5,
      loyaltyPoint: 50,
      address: "78 Phan Đình Phùng, Q3, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 6,
      loyaltyPoint: 120,
      address: "90 Trần Hưng Đạo, Q1, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 7,
      loyaltyPoint: 30,
      address: "11 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 8,
      loyaltyPoint: 95,
      address: "22 Lý Thường Kiệt, Q10, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 9,
      loyaltyPoint: 60,
      address: "33 Cách Mạng Tháng 8, Q10, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 10,
      loyaltyPoint: 175,
      address: "44 Võ Thị Sáu, Q3, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idCustomer: 11,
      loyaltyPoint: 40,
      address: "55 Nguyễn Văn Cừ, Q5, TP.HCM",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("customers", null, {});
}

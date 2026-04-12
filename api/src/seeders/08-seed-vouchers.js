"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("vouchers", [
    {
      title: "GIẢM 10% CHO KHÁCH MỚI",
      discountPercent: 10.0,
      pointCost: 100,
      totalQuantity: 50,
      expiryDate: new Date("2025-12-31"),
      status: true,
      description: "Dành cho khách hàng lần đầu sử dụng dịch vụ",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "GIẢM 20% HÓA ĐƠN TRÊN 200K",
      discountPercent: 20.0,
      pointCost: 200,
      totalQuantity: 30,
      expiryDate: new Date("2025-11-30"),
      status: true,
      description: "Áp dụng cho hóa đơn từ 200.000 VNĐ trở lên",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "VOUCHER HẾT HẠN",
      discountPercent: 15.0,
      pointCost: 150,
      totalQuantity: 10,
      expiryDate: new Date("2024-12-31"),
      status: false,
      description: "Voucher cũ, đã hết hạn sử dụng",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "GIẢM 5% CHO MỌI HÓA ĐƠN",
      discountPercent: 5.0,
      pointCost: 50,
      totalQuantity: 100,
      expiryDate: new Date("2025-12-31"),
      status: true,
      description: "Áp dụng cho tất cả khách hàng, không giới hạn giá trị",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("vouchers", null, {});
}

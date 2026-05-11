"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("banners", [
    {
      title: "Ưu đãi tháng này - Giảm 20%",
      imageUrl: "https://i.pinimg.com/736x/6c/8f/01/6c8f01be1d4d76d7ffcc781710816051.jpg",
      linkUrl: "/promotions",
      startAt: new Date("2025-01-01"),
      endAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "Dịch vụ mới - Nhuộm Highlight",
      imageUrl: "https://i.pinimg.com/1200x/05/6d/d3/056dd39fccee614d4e46d77ef8814bf8.jpg",
      linkUrl: "/services",
      startAt: new Date("2025-03-01"),
      endAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: "Khai trương Chi nhánh Bình Thạnh",
      imageUrl: "https://i.pinimg.com/736x/6c/8f/01/6c8f01be1d4d76d7ffcc781710816051.jpg",
      linkUrl: "/branches",
      startAt: new Date("2025-06-01"),
      endAt: new Date("2025-06-30"),
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("banners", null, {});
}

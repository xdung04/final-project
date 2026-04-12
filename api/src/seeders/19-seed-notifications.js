"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("notifications", [
    {
      type: "BOOKING",
      title: "Đặt lịch thành công",
      content: "Bạn đã đặt lịch cắt tóc thành công. Vui lòng đến đúng giờ.",
      targetRole: "customer",
      targetId: 2,
      isRead: true,
      createdAt: new Date("2025-02-10"),
      updatedAt: new Date("2025-02-10"),
    },
    {
      type: "BOOKING",
      title: "Đặt lịch thành công",
      content: "Bạn đã đặt lịch cắt tóc thành công. Vui lòng đến đúng giờ.",
      targetRole: "customer",
      targetId: 3,
      isRead: false,
      createdAt: new Date("2025-03-15"),
      updatedAt: new Date("2025-03-15"),
    },
    {
      type: "SALARY",
      title: "Lương tháng 3/2025 đã được duyệt",
      content: "Lương tháng 3/2025 của bạn đã được tính và sẵn sàng để thanh toán.",
      targetRole: "barber",
      targetId: 15,
      isRead: false,
      createdAt: new Date("2025-04-01"),
      updatedAt: new Date("2025-04-01"),
    },
    {
      type: "SALARY",
      title: "Lương tháng 3/2025 đã được duyệt",
      content: "Lương tháng 3/2025 của bạn đã được tính và sẵn sàng để thanh toán.",
      targetRole: "barber",
      targetId: 18,
      isRead: true,
      createdAt: new Date("2025-04-01"),
      updatedAt: new Date("2025-04-01"),
    },
    {
      type: "BOOKING",
      title: "Nhắc lịch hẹn",
      content: "Bạn có lịch hẹn vào ngày mai. Vui lòng chuẩn bị đúng giờ.",
      targetRole: "customer",
      targetId: 5,
      isRead: false,
      createdAt: new Date("2025-05-20"),
      updatedAt: new Date("2025-05-20"),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("notifications", null, {});
}

// 02-customersSeeder.js
"use strict";

export async function up(queryInterface) {
  const now = new Date();

  await queryInterface.bulkInsert(
    "customers",[
          // Khách thân thiết — đặt lịch thường xuyên, điểm cao
    { idCustomer:  2, loyaltyPoint: 820, address: "23 Lê Lợi, Quận 1",              createdAt: new Date("2024-12-10"), updatedAt: new Date("2026-05-01") },
    { idCustomer:  3, loyaltyPoint: 640, address: "45 Pasteur, Quận 3",             createdAt: new Date("2024-12-15"), updatedAt: new Date("2026-05-05") },
    { idCustomer:  4, loyaltyPoint: 910, address: "67 Nguyễn Trãi, Quận 5",         createdAt: new Date("2025-01-05"), updatedAt: new Date("2026-05-10") },
    { idCustomer:  5, loyaltyPoint: 750, address: "89 Võ Văn Kiệt, Quận 1",         createdAt: new Date("2025-01-08"), updatedAt: new Date("2026-04-28") },
    { idCustomer:  6, loyaltyPoint: 580, address: "112 Trần Hưng Đạo, Quận 1",      createdAt: new Date("2025-01-12"), updatedAt: new Date("2026-04-20") },
    { idCustomer:  7, loyaltyPoint: 460, address: "25 Đinh Tiên Hoàng, Bình Thạnh", createdAt: new Date("2025-01-20"), updatedAt: new Date("2026-05-08") },
    { idCustomer:  8, loyaltyPoint: 390, address: "78 Lý Thường Kiệt, Quận 10",     createdAt: new Date("2025-02-01"), updatedAt: new Date("2026-05-07") },
    { idCustomer:  9, loyaltyPoint: 710, address: "134 CMT8, Quận 10",              createdAt: new Date("2025-02-10"), updatedAt: new Date("2026-03-15") },
    { idCustomer: 10, loyaltyPoint: 430, address: "203 Võ Thị Sáu, Quận 3",         createdAt: new Date("2025-02-15"), updatedAt: new Date("2026-04-10") },
    { idCustomer: 11, loyaltyPoint: 270, address: "56 Nguyễn Huệ, Quận 1",          createdAt: new Date("2025-02-20"), updatedAt: new Date("2026-05-03") },
 
    // Khách vãng lai — đặt lịch không đều
    { idCustomer: 12, loyaltyPoint: 180, address: "90 Hai Bà Trưng, Quận 1",        createdAt: new Date("2025-03-01"), updatedAt: new Date("2026-04-01") },
    { idCustomer: 13, loyaltyPoint: 220, address: "15 Lê Văn Sỹ, Quận 3",           createdAt: new Date("2025-03-05"), updatedAt: new Date("2026-03-20") },
    { idCustomer: 14, loyaltyPoint: 150, address: "33 Nam Kỳ Khởi Nghĩa, Quận 3",   createdAt: new Date("2025-03-10"), updatedAt: new Date("2026-02-15") },
    { idCustomer: 15, loyaltyPoint: 310, address: "77 Đinh Bộ Lĩnh, Bình Thạnh",    createdAt: new Date("2025-03-15"), updatedAt: new Date("2026-04-25") },
    { idCustomer: 16, loyaltyPoint: 260, address: "200 Xô Viết Nghệ Tĩnh, BT",      createdAt: new Date("2025-03-20"), updatedAt: new Date("2026-05-01") },
    { idCustomer: 17, loyaltyPoint: 195, address: "88 Bạch Đằng, Bình Thạnh",       createdAt: new Date("2025-04-01"), updatedAt: new Date("2026-03-10") },
    { idCustomer: 18, loyaltyPoint: 340, address: "12 Võ Văn Ngân, Thủ Đức",        createdAt: new Date("2025-04-05"), updatedAt: new Date("2026-04-15") },
    { idCustomer: 19, loyaltyPoint: 120, address: "45 Kha Vạn Cân, Thủ Đức",        createdAt: new Date("2025-04-10"), updatedAt: new Date("2026-01-20") },
    { idCustomer: 20, loyaltyPoint: 290, address: "67 Tô Vĩnh Diện, Thủ Đức",       createdAt: new Date("2025-04-15"), updatedAt: new Date("2026-05-02") },
 
    // Khách mới — đăng ký từ Q3/2025 trở đi
    { idCustomer: 21, loyaltyPoint:  80, address: "23 Nguyễn Oanh, Gò Vấp",         createdAt: new Date("2025-05-01"), updatedAt: new Date("2026-04-18") },
    { idCustomer: 22, loyaltyPoint:  60, address: "99 Lê Đức Thọ, Gò Vấp",          createdAt: new Date("2025-05-05"), updatedAt: new Date("2026-04-22") },
    { idCustomer: 23, loyaltyPoint: 110, address: "14 Phan Văn Trị, Gò Vấp",        createdAt: new Date("2025-05-10"), updatedAt: new Date("2026-03-30") },
    { idCustomer: 24, loyaltyPoint:  45, address: "38 Quang Trung, Gò Vấp",          createdAt: new Date("2025-06-01"), updatedAt: new Date("2026-05-08") },
    { idCustomer: 25, loyaltyPoint:  90, address: "55 Lạc Long Quân, Quận 11",       createdAt: new Date("2025-06-10"), updatedAt: new Date("2026-04-30") },
    { idCustomer: 26, loyaltyPoint:  35, address: "17 Tân Kỳ Tân Quý, Bình Tân",    createdAt: new Date("2025-07-01"), updatedAt: new Date("2026-05-05") },
    { idCustomer: 27, loyaltyPoint:  70, address: "82 Kinh Dương Vương, Bình Tân",   createdAt: new Date("2025-07-15"), updatedAt: new Date("2026-04-12") },
    { idCustomer: 28, loyaltyPoint:  20, address: "101 Hậu Giang, Quận 6",           createdAt: new Date("2025-08-01"), updatedAt: new Date("2026-03-05") },
    { idCustomer: 29, loyaltyPoint:  15, address: "29 Phạm Thế Hiển, Quận 8",        createdAt: new Date("2025-09-01"), updatedAt: new Date("2026-02-20") },
    { idCustomer: 30, loyaltyPoint:   0, address: null,                              createdAt: new Date("2025-10-01"), updatedAt: new Date("2026-01-10") },
    { idCustomer: 31, loyaltyPoint:   0, address: null,                              createdAt: new Date("2025-11-01"), updatedAt: new Date("2026-05-09") },
  ], { ignoreDuplicates: true });
    
    
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("customers", null, {});
}
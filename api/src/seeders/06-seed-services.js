"use strict";

export async function up(queryInterface) {
  await queryInterface.bulkInsert(
    "services",
    [
      // ── CẮT TÓC ──────────────────────────────────────────
      {
        idService: 1,
        name: "Cắt tóc Classic",
        description: "Cắt tóc nam cơ bản, tỉa gọn gàng theo phong cách lịch lãm",
        price: 100000,
        duration: 30,
        status: "Active",
        image: "https://i.pinimg.com/736x/49/4d/55/494d5517e87350cce1bd44023b0f7728.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idService: 2,
        name: "Cắt tóc Fade & Taper",
        description: "Kỹ thuật fade, taper, undercut hiện đại — signature của barbershop",
        price: 150000,
        duration: 45,
        status: "Active",
        image: "https://i.pinimg.com/736x/0c/df/2b/0cdf2b43b3535766dabb727379cf0b7b.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idService: 3,
        name: "Cắt tóc Pompadour / Slick Back",
        description: "Tạo kiểu pompadour, slick back, quiff — phong cách retro châu Âu",
        price: 180000,
        duration: 50,
        status: "Active",
        image: "https://i.pinimg.com/736x/4c/26/8e/4c268e2663468da9ea4cd3a789d88d29.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ── RÂU ──────────────────────────────────────────────
      {
        idService: 4,
        name: "Tạo kiểu râu",
        description: "Tỉa, tạo hình râu theo ý muốn — beard shaping chuyên nghiệp",
        price: 80000,
        duration: 20,
        status: "Active",
        image: "https://i.pinimg.com/736x/43/3a/9e/433a9e7ce02eb2dbd58c57d43bbcf9a3.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idService: 5,
        name: "Cạo râu dao cạo thẳng",
        description: "Cạo râu truyền thống bằng dao thẳng, khăn nóng — trải nghiệm barbershop chuẩn Âu",
        price: 120000,
        duration: 25,
        status: "Active",
        image: "https://i.pinimg.com/736x/43/3a/9e/433a9e7ce02eb2dbd58c57d43bbcf9a3.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ── COMBO ─────────────────────────────────────────────
      {
        idService: 6,
        name: "Combo Cắt + Râu",
        description: "Cắt tóc Fade kết hợp tạo kiểu râu — tiết kiệm hơn đặt riêng",
        price: 200000,
        duration: 60,
        status: "Active",
        image: "https://i.pinimg.com/736x/49/4d/55/494d5517e87350cce1bd44023b0f7728.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idService: 7,
        name: "Combo Cắt + Gội",
        description: "Cắt tóc kết hợp gội đầu massage — combo phổ biến nhất",
        price: 160000,
        duration: 50,
        status: "Active",
        image: "https://i.pinimg.com/736x/00/cd/b1/00cdb113ab219a6700e676e99a3caeb3.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ── CHĂM SÓC ─────────────────────────────────────────
      {
        idService: 8,
        name: "Gội đầu & Massage da đầu",
        description: "Gội sạch kết hợp massage da đầu thư giãn, giảm stress",
        price: 80000,
        duration: 20,
        status: "Active",
        image: "https://i.pinimg.com/736x/00/cd/b1/00cdb113ab219a6700e676e99a3caeb3.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idService: 9,
        name: "Chăm sóc da mặt nam",
        description: "Làm sạch sâu, dưỡng ẩm và trị liệu da mặt chuyên biệt cho nam",
        price: 250000,
        duration: 40,
        status: "Active",
        image: "https://i.pinimg.com/736x/43/3a/9e/433a9e7ce02eb2dbd58c57d43bbcf9a3.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ── NHUỘM / UỐN ───────────────────────────────────────
      {
        idService: 10,
        name: "Nhuộm tóc nam",
        description: "Nhuộm màu tóc nam theo yêu cầu — tông tự nhiên hoặc cá tính",
        price: 300000,
        duration: 60,
        status: "Active",
        image: "https://i.pinimg.com/736x/2c/b1/6b/2cb16ba0ce50615728f36007f81b00d4.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idService: 11,
        name: "Tẩy tóc nam",
        description: "Tẩy tóc lên nền sáng chuẩn bị cho nhuộm màu",
        price: 350000,
        duration: 75,
        status: "Active",
        image: "https://i.pinimg.com/736x/2c/b1/6b/2cb16ba0ce50615728f36007f81b00d4.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idService: 12,
        name: "Uốn tóc nam",
        description: "Uốn xoăn nhẹ, uốn sóng hoặc uốn duỗi cho tóc nam — đang rất trend",
        price: 450000,
        duration: 90,
        status: "Active",
        image: "https://i.pinimg.com/736x/4c/26/8e/4c268e2663468da9ea4cd3a789d88d29.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    { ignoreDuplicates: true }
  );
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("services", null, {});
}
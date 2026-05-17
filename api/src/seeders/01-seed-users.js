"use strict";
import bcrypt from "bcrypt";

export async function up(queryInterface, Sequelize) {
  const hashedPassword = await bcrypt.hash("123456", 10);
  const now = new Date();
  const users = [];

  // Admin ID 1
  users.push({
    idUser: 1,
    email: "admin@example.com",
    password: hashedPassword,
    fullName: "System Admin",
    phoneNumber: "0900000001",
    authProvider: "local",
    isStatus: true,
    image: null,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  // 10 customers cũ (ID 2-11)
  const oldNames = [
    "Nguyen Van An", "Le Thi Bich", "Tran Van Cuong", "Pham Thi Dung",
    "Hoang Van Em", "Vu Thi Phuong", "Do Van Giang", "Nguyen Thi Hoa",
    "Tran Van Hung", "Le Van Kiet"
  ];
  for (let i = 0; i < 10; i++) {
    const id = 2 + i;
    users.push({
      idUser: id,
      email: `old_customer_${id}@example.com`,
      password: hashedPassword,
      fullName: oldNames[i],
      phoneNumber: `091100000${id}`,
      authProvider: "local",
      isStatus: true,
      image: null,
      role: "customer",
      createdAt: now,
      updatedAt: now,
    });
  }

  // 3 receptionists (ID 12,13,14)
  for (let id = 12; id <= 14; id++) {
    users.push({
      idUser: id,
      email: `receptionist${id}@example.com`,
      password: hashedPassword,
      fullName: `Receptionist ${id}`,
      phoneNumber: `092200000${id}`,
      authProvider: "local",
      isStatus: true,
      image: null,
      role: "receptionist",
      createdAt: now,
      updatedAt: now,
    });
  }

  // 9 barbers (ID 15-23)
  const barberNames = [
    "Nguyen Van Phong", "Tran Van Quan", "Le Thi Rung", "Pham Van Son",
    "Hoang Thi Thu", "Vu Van Uyen", "Do Van Viet", "Nguyen Thi Xuan", "Tran Van Yen"
  ];
  const barberImages = [
    "https://i.pinimg.com/1200x/35/b4/b9/35b4b917fbf4fd6a41c6034ec996dca3.jpg",
    "https://i.pinimg.com/736x/61/84/f8/6184f814c0e45527e449f9a5ba8ad6d4.jpg",
    "https://i.pinimg.com/1200x/96/0a/11/960a113e59d05914c0de85b3f21a2bc2.jpg",
    "https://i.pinimg.com/736x/c2/6a/ea/c26aeabbdc52d070051c0992a5776ce8.jpg",
    "https://i.pinimg.com/1200x/19/91/00/19910037265c053680b1c122a7d33b37.jpg",
    "https://i.pinimg.com/1200x/35/b4/b9/35b4b917fbf4fd6a41c6034ec996dca3.jpg",
    "https://i.pinimg.com/736x/61/84/f8/6184f814c0e45527e449f9a5ba8ad6d4.jpg",
    "https://i.pinimg.com/1200x/96/0a/11/960a113e59d05914c0de85b3f21a2bc2.jpg",
    "https://i.pinimg.com/736x/c2/6a/ea/c26aeabbdc52d070051c0992a5776ce8.jpg"
  ];
  for (let i = 0; i < 9; i++) {
    const id = 15 + i;
    users.push({
      idUser: id,
      email: `barber${id}@example.com`,
      password: hashedPassword,
      fullName: barberNames[i],
      phoneNumber: `093300000${id}`,
      authProvider: "local",
      isStatus: true,
      image: barberImages[i],
      role: "barber",
      createdAt: now,
      updatedAt: now,
    });
  }

  // Thêm 200 customers mới (ID 24 -> 223)
  for (let id = 24; id <= 223; id++) {
    users.push({
      idUser: id,
      email: `customer_new_${id}@example.com`,
      password: hashedPassword,
      fullName: `Khách Hàng ${id}`,
      phoneNumber: `09${String(10000000 + id).slice(0, 9)}`,
      authProvider: "local",
      isStatus: true,
      image: null,
      role: "customer",
      createdAt: now,
      updatedAt: now,
    });
  }

  await queryInterface.bulkInsert("users", users);
  console.log(`✅ Seeded ${users.length} users (1 admin, 10 old customers, 3 receptionists, 9 barbers, 200 new customers)`);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("users", null, {});
}
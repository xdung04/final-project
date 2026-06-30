"use strict";
import bcrypt from "bcrypt";

// ════════════════════════════════════════════════════════════════════════════
// FILE 01 — users
//
// idUser layout:
//   1          → admin
//   2  → 31    → customers (30 người)
//   32 → 35    → receptionists (4 chi nhánh)
//   36 → 75    → barbers (4 chi nhánh × 10 thợ)
//                  Branch 1: 36–45
//                  Branch 2: 46–55
//                  Branch 3: 56–65
//                  Branch 4: 66–75
// ════════════════════════════════════════════════════════════════════════════

const avatarBarbers = [
  "https://i.pinimg.com/1200x/35/b4/b9/35b4b917fbf4fd6a41c6034ec996dca3.jpg",
  "https://i.pinimg.com/736x/61/84/f8/6184f814c0e45527e449f9a5ba8ad6d4.jpg",
  "https://i.pinimg.com/1200x/96/0a/11/960a113e59d05914c0de85b3f21a2bc2.jpg",
  "https://i.pinimg.com/736x/c2/6a/ea/c26aeabbdc52d070051c0992a5776ce8.jpg",
  "https://i.pinimg.com/1200x/19/91/00/19910037265c053680b1c122a7d33b37.jpg",
];

export async function up(queryInterface) {
  const pw = await bcrypt.hash("123456", 10);
  const now = new Date();

  const users = [
    // ── ADMIN ────────────────────────────────────────────────────────────────
    {
      idUser: 1, email: "admin@barber.com", password: pw,
      fullName: "System Admin", phoneNumber: "0900000001",
      authProvider: "local", isStatus: true, image: null, role: "admin",
      createdAt: new Date("2024-12-01"), updatedAt: new Date("2024-12-01"),
    },

    // ── CUSTOMERS (2 → 31) ───────────────────────────────────────────────────
    { idUser:  2, email: "kh01@mail.com", password: pw, fullName: "Nguyen Van An",      phoneNumber: "0911100001", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2024-12-10"), updatedAt: now },
    { idUser:  3, email: "kh02@mail.com", password: pw, fullName: "Le Thi Bich",        phoneNumber: "0911100002", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2024-12-15"), updatedAt: now },
    { idUser:  4, email: "kh03@mail.com", password: pw, fullName: "Tran Van Cuong",     phoneNumber: "0911100003", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-01-05"), updatedAt: now },
    { idUser:  5, email: "kh04@mail.com", password: pw, fullName: "Pham Thi Dung",      phoneNumber: "0911100004", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-01-08"), updatedAt: now },
    { idUser:  6, email: "kh05@mail.com", password: pw, fullName: "Hoang Van Em",       phoneNumber: "0911100005", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-01-12"), updatedAt: now },
    { idUser:  7, email: "kh06@mail.com", password: pw, fullName: "Vu Thi Phuong",      phoneNumber: "0911100006", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-01-20"), updatedAt: now },
    { idUser:  8, email: "kh07@mail.com", password: pw, fullName: "Do Van Giang",       phoneNumber: "0911100007", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-02-01"), updatedAt: now },
    { idUser:  9, email: "kh08@mail.com", password: pw, fullName: "Nguyen Thi Hoa",     phoneNumber: "0911100008", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-02-10"), updatedAt: now },
    { idUser: 10, email: "kh09@mail.com", password: pw, fullName: "Tran Van Hung",      phoneNumber: "0911100009", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-02-15"), updatedAt: now },
    { idUser: 11, email: "kh10@mail.com", password: pw, fullName: "Le Van Kiet",        phoneNumber: "0911100010", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-02-20"), updatedAt: now },
    { idUser: 12, email: "kh11@mail.com", password: pw, fullName: "Bui Thi Lan",        phoneNumber: "0911100011", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-03-01"), updatedAt: now },
    { idUser: 13, email: "kh12@mail.com", password: pw, fullName: "Dang Van Long",      phoneNumber: "0911100012", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-03-05"), updatedAt: now },
    { idUser: 14, email: "kh13@mail.com", password: pw, fullName: "Ly Thi Mai",         phoneNumber: "0911100013", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-03-10"), updatedAt: now },
    { idUser: 15, email: "kh14@mail.com", password: pw, fullName: "Phan Van Nam",       phoneNumber: "0911100014", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-03-15"), updatedAt: now },
    { idUser: 16, email: "kh15@mail.com", password: pw, fullName: "Vo Thi Oanh",        phoneNumber: "0911100015", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-03-20"), updatedAt: now },
    { idUser: 17, email: "kh16@mail.com", password: pw, fullName: "Cao Van Phuc",       phoneNumber: "0911100016", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-04-01"), updatedAt: now },
    { idUser: 18, email: "kh17@mail.com", password: pw, fullName: "Doan Thi Quyen",     phoneNumber: "0911100017", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-04-05"), updatedAt: now },
    { idUser: 19, email: "kh18@mail.com", password: pw, fullName: "Ha Van Sang",        phoneNumber: "0911100018", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-04-10"), updatedAt: now },
    { idUser: 20, email: "kh19@mail.com", password: pw, fullName: "Mai Thi Thu",        phoneNumber: "0911100019", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-04-15"), updatedAt: now },
    { idUser: 21, email: "kh20@mail.com", password: pw, fullName: "Ngo Van Tin",        phoneNumber: "0911100020", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-05-01"), updatedAt: now },
    { idUser: 22, email: "kh21@mail.com", password: pw, fullName: "Trinh Thi Uyen",     phoneNumber: "0911100021", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-05-05"), updatedAt: now },
    { idUser: 23, email: "kh22@mail.com", password: pw, fullName: "Truong Van Viet",    phoneNumber: "0911100022", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-05-10"), updatedAt: now },
    { idUser: 24, email: "kh23@mail.com", password: pw, fullName: "Vuong Thi Xuan",     phoneNumber: "0911100023", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-06-01"), updatedAt: now },
    { idUser: 25, email: "kh24@mail.com", password: pw, fullName: "Au Van Yen",         phoneNumber: "0911100024", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-06-10"), updatedAt: now },
    { idUser: 26, email: "kh25@mail.com", password: pw, fullName: "Bach Thi An",        phoneNumber: "0911100025", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-07-01"), updatedAt: now },
    { idUser: 27, email: "kh26@mail.com", password: pw, fullName: "Cat Van Binh",       phoneNumber: "0911100026", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-07-15"), updatedAt: now },
    { idUser: 28, email: "kh27@mail.com", password: pw, fullName: "Dinh Thi Chau",      phoneNumber: "0911100027", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-08-01"), updatedAt: now },
    { idUser: 29, email: "kh28@mail.com", password: pw, fullName: "Giang Van Duc",      phoneNumber: "0911100028", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-09-01"), updatedAt: now },
    { idUser: 30, email: "kh29@mail.com", password: pw, fullName: "Huynh Thi Gia",      phoneNumber: "0911100029", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-10-01"), updatedAt: now },
    { idUser: 31, email: "kh30@mail.com", password: pw, fullName: "Kieu Van Ha",        phoneNumber: "0911100030", authProvider: "local", isStatus: true, image: null, role: "customer", createdAt: new Date("2025-11-01"), updatedAt: now },

    // ── RECEPTIONISTS (32 → 35) ───────────────────────────────────────────
    { idUser: 32, email: "letan1@barber.com", password: pw, fullName: "Nguyen Thi Lan",   phoneNumber: "0922000001", authProvider: "local", isStatus: true, image: null, role: "receptionist", createdAt: new Date("2024-12-15"), updatedAt: now },
    { idUser: 33, email: "letan2@barber.com", password: pw, fullName: "Tran Thi Mai",     phoneNumber: "0922000002", authProvider: "local", isStatus: true, image: null, role: "receptionist", createdAt: new Date("2024-12-15"), updatedAt: now },
    { idUser: 34, email: "letan3@barber.com", password: pw, fullName: "Le Thi Ngoc",      phoneNumber: "0922000003", authProvider: "local", isStatus: true, image: null, role: "receptionist", createdAt: new Date("2024-12-15"), updatedAt: now },
    { idUser: 35, email: "letan4@barber.com", password: pw, fullName: "Pham Thi Quynh",   phoneNumber: "0922000004", authProvider: "local", isStatus: true, image: null, role: "receptionist", createdAt: new Date("2025-01-15"), updatedAt: now },

    // ── BARBERS Branch 1 (36 → 45) ───────────────────────────────────────
    // B36 = Master (lên từ Senior cuối 2024)
    // B37 = Senior (lên từ Junior 2025-07)
    // B38 = Senior (lên từ Junior 2025-10)
    // B39-B42 = Junior đang active, đủ tháng & doanh thu để xét lên Senior
    // B43 = Junior doanh thu thấp → fail lên cấp
    // B44 = Junior mới (chưa đủ tháng)
    // B45 = Junior mới nhất
    { idUser: 36, email: "barber.b1.01@barber.com", password: pw, fullName: "Nguyen Van Phong",   phoneNumber: "0933100001", authProvider: "local", isStatus: true, image: avatarBarbers[0], role: "barber", createdAt: new Date("2024-06-01"), updatedAt: now },
    { idUser: 37, email: "barber.b1.02@barber.com", password: pw, fullName: "Tran Van Quan",      phoneNumber: "0933100002", authProvider: "local", isStatus: true, image: avatarBarbers[1], role: "barber", createdAt: new Date("2024-08-01"), updatedAt: now },
    { idUser: 38, email: "barber.b1.03@barber.com", password: pw, fullName: "Le Van Rung",        phoneNumber: "0933100003", authProvider: "local", isStatus: true, image: avatarBarbers[2], role: "barber", createdAt: new Date("2024-10-01"), updatedAt: now },
    { idUser: 39, email: "barber.b1.04@barber.com", password: pw, fullName: "Pham Van Son",       phoneNumber: "0933100004", authProvider: "local", isStatus: true, image: avatarBarbers[3], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 40, email: "barber.b1.05@barber.com", password: pw, fullName: "Hoang Van Tu",       phoneNumber: "0933100005", authProvider: "local", isStatus: true, image: avatarBarbers[4], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 41, email: "barber.b1.06@barber.com", password: pw, fullName: "Vu Van Uyen",        phoneNumber: "0933100006", authProvider: "local", isStatus: true, image: avatarBarbers[0], role: "barber", createdAt: new Date("2025-02-01"), updatedAt: now },
    { idUser: 42, email: "barber.b1.07@barber.com", password: pw, fullName: "Do Van Viet",        phoneNumber: "0933100007", authProvider: "local", isStatus: true, image: avatarBarbers[1], role: "barber", createdAt: new Date("2025-03-01"), updatedAt: now },
    { idUser: 43, email: "barber.b1.08@barber.com", password: pw, fullName: "Nguyen Van Xuan",    phoneNumber: "0933100008", authProvider: "local", isStatus: true, image: avatarBarbers[2], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 44, email: "barber.b1.09@barber.com", password: pw, fullName: "Tran Van Yen",       phoneNumber: "0933100009", authProvider: "local", isStatus: true, image: avatarBarbers[3], role: "barber", createdAt: new Date("2025-10-01"), updatedAt: now },
    { idUser: 45, email: "barber.b1.10@barber.com", password: pw, fullName: "Le Van Zung",        phoneNumber: "0933100010", authProvider: "local", isStatus: true, image: avatarBarbers[4], role: "barber", createdAt: new Date("2026-01-01"), updatedAt: now },

    // ── BARBERS Branch 2 (46 → 55) ───────────────────────────────────────
    { idUser: 46, email: "barber.b2.01@barber.com", password: pw, fullName: "Pham Van An",        phoneNumber: "0933200001", authProvider: "local", isStatus: true, image: avatarBarbers[0], role: "barber", createdAt: new Date("2024-06-01"), updatedAt: now },
    { idUser: 47, email: "barber.b2.02@barber.com", password: pw, fullName: "Hoang Thi Binh",     phoneNumber: "0933200002", authProvider: "local", isStatus: true, image: avatarBarbers[1], role: "barber", createdAt: new Date("2024-08-01"), updatedAt: now },
    { idUser: 48, email: "barber.b2.03@barber.com", password: pw, fullName: "Vu Van Chinh",       phoneNumber: "0933200003", authProvider: "local", isStatus: true, image: avatarBarbers[2], role: "barber", createdAt: new Date("2024-10-01"), updatedAt: now },
    { idUser: 49, email: "barber.b2.04@barber.com", password: pw, fullName: "Do Thi Diem",        phoneNumber: "0933200004", authProvider: "local", isStatus: true, image: avatarBarbers[3], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 50, email: "barber.b2.05@barber.com", password: pw, fullName: "Nguyen Van Em",      phoneNumber: "0933200005", authProvider: "local", isStatus: true, image: avatarBarbers[4], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 51, email: "barber.b2.06@barber.com", password: pw, fullName: "Tran Thi Phuong",    phoneNumber: "0933200006", authProvider: "local", isStatus: true, image: avatarBarbers[0], role: "barber", createdAt: new Date("2025-02-01"), updatedAt: now },
    { idUser: 52, email: "barber.b2.07@barber.com", password: pw, fullName: "Le Van Giang",       phoneNumber: "0933200007", authProvider: "local", isStatus: true, image: avatarBarbers[1], role: "barber", createdAt: new Date("2025-03-01"), updatedAt: now },
    { idUser: 53, email: "barber.b2.08@barber.com", password: pw, fullName: "Pham Thi Hoa",       phoneNumber: "0933200008", authProvider: "local", isStatus: true, image: avatarBarbers[2], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 54, email: "barber.b2.09@barber.com", password: pw, fullName: "Hoang Van Hung",     phoneNumber: "0933200009", authProvider: "local", isStatus: true, image: avatarBarbers[3], role: "barber", createdAt: new Date("2025-10-01"), updatedAt: now },
    { idUser: 55, email: "barber.b2.10@barber.com", password: pw, fullName: "Vu Thi Kieu",        phoneNumber: "0933200010", authProvider: "local", isStatus: true, image: avatarBarbers[4], role: "barber", createdAt: new Date("2026-01-01"), updatedAt: now },

    // ── BARBERS Branch 3 (56 → 65) ───────────────────────────────────────
    { idUser: 56, email: "barber.b3.01@barber.com", password: pw, fullName: "Do Van Lam",         phoneNumber: "0933300001", authProvider: "local", isStatus: true, image: avatarBarbers[0], role: "barber", createdAt: new Date("2024-06-01"), updatedAt: now },
    { idUser: 57, email: "barber.b3.02@barber.com", password: pw, fullName: "Nguyen Thi My",      phoneNumber: "0933300002", authProvider: "local", isStatus: true, image: avatarBarbers[1], role: "barber", createdAt: new Date("2024-08-01"), updatedAt: now },
    { idUser: 58, email: "barber.b3.03@barber.com", password: pw, fullName: "Tran Van Nam",       phoneNumber: "0933300003", authProvider: "local", isStatus: true, image: avatarBarbers[2], role: "barber", createdAt: new Date("2024-10-01"), updatedAt: now },
    { idUser: 59, email: "barber.b3.04@barber.com", password: pw, fullName: "Le Thi Oanh",        phoneNumber: "0933300004", authProvider: "local", isStatus: true, image: avatarBarbers[3], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 60, email: "barber.b3.05@barber.com", password: pw, fullName: "Pham Van Phuc",      phoneNumber: "0933300005", authProvider: "local", isStatus: true, image: avatarBarbers[4], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 61, email: "barber.b3.06@barber.com", password: pw, fullName: "Hoang Thi Quyen",    phoneNumber: "0933300006", authProvider: "local", isStatus: true, image: avatarBarbers[0], role: "barber", createdAt: new Date("2025-02-01"), updatedAt: now },
    { idUser: 62, email: "barber.b3.07@barber.com", password: pw, fullName: "Vu Van Sang",        phoneNumber: "0933300007", authProvider: "local", isStatus: true, image: avatarBarbers[1], role: "barber", createdAt: new Date("2025-03-01"), updatedAt: now },
    { idUser: 63, email: "barber.b3.08@barber.com", password: pw, fullName: "Do Thi Thu",         phoneNumber: "0933300008", authProvider: "local", isStatus: true, image: avatarBarbers[2], role: "barber", createdAt: new Date("2025-01-01"), updatedAt: now },
    { idUser: 64, email: "barber.b3.09@barber.com", password: pw, fullName: "Nguyen Van Tin",     phoneNumber: "0933300009", authProvider: "local", isStatus: true, image: avatarBarbers[3], role: "barber", createdAt: new Date("2025-10-01"), updatedAt: now },
    { idUser: 65, email: "barber.b3.10@barber.com", password: pw, fullName: "Tran Thi Uyen",      phoneNumber: "0933300010", authProvider: "local", isStatus: true, image: avatarBarbers[4], role: "barber", createdAt: new Date("2026-01-01"), updatedAt: now },

    // ── BARBERS Branch 4 — Thủ Đức (66 → 75) ─────────────────────────────
    // Chi nhánh đang Inactive (tạm ngưng) → barber vẫn tồn tại, không có booking mới
    { idUser: 66, email: "barber.b4.01@barber.com", password: pw, fullName: "Le Van Viet",        phoneNumber: "0933400001", authProvider: "local", isStatus: true, image: avatarBarbers[0], role: "barber", createdAt: new Date("2025-01-15"), updatedAt: now },
    { idUser: 67, email: "barber.b4.02@barber.com", password: pw, fullName: "Pham Thi Xuan",      phoneNumber: "0933400002", authProvider: "local", isStatus: true, image: avatarBarbers[1], role: "barber", createdAt: new Date("2025-01-15"), updatedAt: now },
    { idUser: 68, email: "barber.b4.03@barber.com", password: pw, fullName: "Hoang Van Yen",      phoneNumber: "0933400003", authProvider: "local", isStatus: true, image: avatarBarbers[2], role: "barber", createdAt: new Date("2025-02-01"), updatedAt: now },
    { idUser: 69, email: "barber.b4.04@barber.com", password: pw, fullName: "Vu Thi Anh",         phoneNumber: "0933400004", authProvider: "local", isStatus: true, image: avatarBarbers[3], role: "barber", createdAt: new Date("2025-02-01"), updatedAt: now },
    { idUser: 70, email: "barber.b4.05@barber.com", password: pw, fullName: "Do Van Bao",         phoneNumber: "0933400005", authProvider: "local", isStatus: true, image: avatarBarbers[4], role: "barber", createdAt: new Date("2025-03-01"), updatedAt: now },
    { idUser: 71, email: "barber.b4.06@barber.com", password: pw, fullName: "Nguyen Thi Cat",     phoneNumber: "0933400006", authProvider: "local", isStatus: true, image: avatarBarbers[0], role: "barber", createdAt: new Date("2025-03-01"), updatedAt: now },
    { idUser: 72, email: "barber.b4.07@barber.com", password: pw, fullName: "Tran Van Dan",       phoneNumber: "0933400007", authProvider: "local", isStatus: true, image: avatarBarbers[1], role: "barber", createdAt: new Date("2025-04-01"), updatedAt: now },
    { idUser: 73, email: "barber.b4.08@barber.com", password: pw, fullName: "Le Thi Dung",        phoneNumber: "0933400008", authProvider: "local", isStatus: true, image: avatarBarbers[2], role: "barber", createdAt: new Date("2025-04-01"), updatedAt: now },
    { idUser: 74, email: "barber.b4.09@barber.com", password: pw, fullName: "Pham Van Giang",     phoneNumber: "0933400009", authProvider: "local", isStatus: true, image: avatarBarbers[3], role: "barber", createdAt: new Date("2025-05-01"), updatedAt: now },
    { idUser: 75, email: "barber.b4.10@barber.com", password: pw, fullName: "Hoang Thi Ha",       phoneNumber: "0933400010", authProvider: "local", isStatus: true, image: avatarBarbers[4], role: "barber", createdAt: new Date("2025-05-01"), updatedAt: now },
  ];

  await queryInterface.bulkInsert("users", users, { ignoreDuplicates: true });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("users", null, {});
}
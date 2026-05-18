"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 02 — branches (4 chi nhánh)
//
// Branch 1 — Quận 1   : Active
// Branch 2 — Quận 3   : Active
// Branch 3 — Bình Thạnh: Active
// Branch 4 — Thủ Đức  : Inactive (test flow tạm ngưng)
//   suspendDate = 2026-04-01 (đã qua → Cron đã tạm ngưng, cho phép sửa info)
//   resumeDate  = 2026-06-01 (chưa đến → Cron sẽ mở lại, sau đó khoá sửa)
// ════════════════════════════════════════════════════════════════════════════

export async function up(queryInterface) {
  await queryInterface.bulkInsert("branches", [
    {
      idBranch: 1,
      name: "Chi nhánh Quận 1",
      address: "23 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
      // Tọa độ thật: đoạn đường Lê Lợi gần Rex Hotel
      latitude:  10.77310000,
      longitude: 106.70150000,
      openTime:    "08:00:00",
      closeTime:   "21:00:00",
      slotDuration: 60,
      status: "Active",
      suspendDate: null,
      resumeDate:  null,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2024-12-01"),
    },
    {
      idBranch: 2,
      name: "Chi nhánh Quận 3",
      address: "168 Nguyễn Đình Chiểu, Phường 6, Quận 3, TP.HCM",
      // Tọa độ thật: đường Nguyễn Đình Chiểu đoạn gần Cách Mạng Tháng 8
      latitude:  10.77850000,
      longitude: 106.68620000,
      openTime:    "08:00:00",
      closeTime:   "21:00:00",
      slotDuration: 60,
      status: "Active",
      suspendDate: null,
      resumeDate:  null,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2024-12-01"),
    },
    {
      idBranch: 3,
      name: "Chi nhánh Bình Thạnh",
      address: "345 Đinh Bộ Lĩnh, Phường 26, Bình Thạnh, TP.HCM",
      // Tọa độ thật: đường Đinh Bộ Lĩnh đoạn gần chợ Bà Chiểu
      latitude:  10.81380000,
      longitude: 106.71260000,
      openTime:    "08:00:00",
      closeTime:   "21:00:00",
      slotDuration: 60,
      status: "Active",
      suspendDate: null,
      resumeDate:  null,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2024-12-01"),
    },
    {
      idBranch: 4,
      name: "Chi nhánh Thủ Đức",
      address: "12 Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP.HCM",
      // Tọa độ thật: giao lộ Võ Văn Ngân – Đặng Văn Bi, gần ĐH Sư Phạm Kỹ Thuật
      latitude:  10.84920000,
      longitude: 106.77450000,
      openTime:    "08:00:00",
      closeTime:   "21:00:00",
      slotDuration: 60,
      // ── Test flow tạm ngưng ───────────────────────────────────────────
      status: "Inactive",
      suspendDate: "2026-04-01",  // Cron đã kích hoạt → đang cho phép sửa
      resumeDate:  "2026-06-01",  // Admin đã set → Cron sẽ mở lại
      createdAt: new Date("2025-01-15"),
      updatedAt: new Date("2026-04-01"),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("branches", null, {});
}
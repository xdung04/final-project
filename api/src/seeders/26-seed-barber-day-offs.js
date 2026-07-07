"use strict";



export async function up(queryInterface) {
  await queryInterface.bulkDelete("barber_day_offs", null, {});

  const now = new Date();

  const dayOffs = [
    // ── QUÁ KHỨ — "Đã qua" ───────────────────────────────────────────────

    // Barber 39 (Branch 1, Junior): nghỉ 3 ngày tháng 3/2026
    { idBarber: 39, startDate: "2026-03-10", endDate: "2026-03-12", reason: "Nghỉ phép năm" },

    // Barber 47 (Branch 2, Senior): nghỉ 2 ngày tháng 2/2026
    { idBarber: 47, startDate: "2026-02-17", endDate: "2026-02-18", reason: "Việc gia đình" },

    // Barber 57 (Branch 3, Senior): nghỉ 1 ngày tháng 1/2026
    { idBarber: 57, startDate: "2026-01-20", endDate: "2026-01-20", reason: "Nghỉ ốm" },

    // Barber 36 (Branch 1, Master): nghỉ 2 ngày tháng 4/2026
    { idBarber: 36, startDate: "2026-04-07", endDate: "2026-04-08", reason: "Đám cưới" },

    // Barber 66 (Branch 4, Senior): nghỉ 5 ngày tháng 3/2026
    { idBarber: 66, startDate: "2026-03-03", endDate: "2026-03-07", reason: "Nghỉ phép năm" },

    // ── ĐANG DIỄN RA — hôm nay 25/06/2026 nằm trong range ────────────────

    // Barber 40 (Branch 1, Junior): đang nghỉ
    { idBarber: 40, startDate: "2026-06-23", endDate: "2026-06-27", reason: "Nghỉ ốm - đang điều trị" },

    // Barber 50 (Branch 2, Junior): nghỉ đúng hôm nay 1 ngày
    { idBarber: 50, startDate: "2026-06-25", endDate: "2026-06-25", reason: "Việc cá nhân" },

    // ── TƯƠNG LAI — cho phép sửa/xóa ─────────────────────────────────────

    // Barber 41 (Branch 1, Junior)
    { idBarber: 41, startDate: "2026-07-07", endDate: "2026-07-09", reason: "Nghỉ phép" },

    // Barber 48 (Branch 2, Senior)
    { idBarber: 48, startDate: "2026-07-14", endDate: "2026-07-18", reason: "Du lịch" },

    // Barber 59 (Branch 3, Junior): nghỉ 1 ngày
    { idBarber: 59, startDate: "2026-07-21", endDate: "2026-07-21", reason: "Khám sức khỏe" },

    // Barber 46 (Branch 2, Master)
    { idBarber: 46, startDate: "2026-08-04", endDate: "2026-08-06", reason: "Việc gia đình" },
  ];

  await queryInterface.bulkInsert(
    "barber_day_offs",
    dayOffs.map((d) => ({ ...d, createdAt: now, updatedAt: now }))
  );

  console.log(`✅ [09] Inserted ${dayOffs.length} barber_day_offs`);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("barber_day_offs", null, {});
  console.log("↩️  [09] Rolled back barber_day_offs");
}
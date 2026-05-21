// utils/seasonContext.js
//
// Tự động tính ngày lễ âm lịch VN — không hardcode, không gọi API ngoài
// Package: npm install @dqcai/vn-lunar
//
// Dùng trong summaryStatisticService.js:
//   import { getSeasonContext } from "../utils/seasonContext.js";
//   const seasonCtx = getSeasonContext(month, year); // sync, không cần await

import { getSolarDate } from "@dqcai/vn-lunar";

// ─── Helper: âm lịch → dương lịch an toàn ────────────────────────────────────
const toSolar = (lunarDay, lunarMonth, year) => {
  try {
    return getSolarDate(lunarDay, lunarMonth, year);
    // trả về { day, month, year } — month là 1-based
  } catch {
    return null;
  }
};

// ─── Ngày lễ cố định dương lịch (không đổi theo năm) ─────────────────────────
const FIXED_HOLIDAYS = [
  {
    month: 1, day: 1,
    name: "Tết Dương Lịch",
    impact: "nghỉ 1-3 ngày, khách cắt tóc tất niên đã dồn vào cuối tháng 12.",
  },
  {
    month: 4, day: 30,
    name: "Ngày Giải Phóng Miền Nam",
    impact: "nghỉ lễ 3-5 ngày, booking tăng 2-3 ngày trước lễ, giảm trong kỳ nghỉ.",
  },
  {
    month: 5, day: 1,
    name: "Quốc Tế Lao Động",
    impact: "nối liền với 30/4, khách thường đã cắt tóc trước kỳ nghỉ.",
  },
  {
    month: 9, day: 2,
    name: "Quốc Khánh",
    impact: "nghỉ 3-5 ngày, khách dồn cắt tóc cuối tháng 8 và đầu tháng 9 trước lễ.",
  },
  {
    month: 12, day: 24,
    name: "Noel (24-25/12)",
    impact: "không phải ngày nghỉ chính thức nhưng không khí lễ hội kéo khách ra đường nhiều hơn, doanh thu nhích tăng.",
  },
];

// ─── Base context theo tháng (đặc điểm ngành barbershop) ─────────────────────
const BASE_CONTEXT = {
  1:  "Tháng 1 biến động lớn — phụ thuộc Tết Nguyên Đán rơi sớm hay muộn.",
  2:  "Tháng 2 biến động tương tự tháng 1 nếu Tết rơi đây, ngược lại doanh thu phục hồi bình thường.",
  3:  "Tháng 3 phục hồi sau Tết, doanh thu ổn định dần nhưng chưa đạt đỉnh.",
  4:  "Tháng 4 có kỳ nghỉ lễ 30/4 cuối tháng — booking tăng trước lễ, giảm trong lễ.",
  5:  "Tháng 5 ổn định sau kỳ nghỉ 30/4–1/5, phản ánh trung thực năng lực vận hành của shop.",
  6:  "Tháng 6 nghỉ hè bắt đầu — học sinh sinh viên là nhóm khách tăng mạnh, nhu cầu tạo kiểu mới cao.",
  7:  "Tháng 7 cao điểm hè — đỉnh lượng khách trẻ trong năm, dịch vụ tạo kiểu và uốn duỗi tăng rõ rệt.",
  8:  "Tháng 8 cuối hè — nhu cầu cắt gọn gàng chuẩn bị năm học mới tăng mạnh vào cuối tháng.",
  9:  "Tháng 9 có 2/9 Quốc Khánh — khách dồn cắt tóc trước lễ, trong lễ booking giảm.",
  10: "Tháng 10 bình thường, không có yếu tố mùa vụ nổi bật — cạnh tranh giữ chân khách quen là yếu tố quyết định.",
  11: "Tháng 11 khách bắt đầu chú ý diện mạo cho mùa tiệc tùng cuối năm, doanh thu nhích dần.",
  12: "Tháng 12 đỉnh năm — không khí Noel cộng chuẩn bị Tết Dương và Tết Âm đẩy doanh thu lên cao nhất.",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Trả về context mùa vụ cho AI — tự động tính ngày lễ âm lịch theo năm
 * Sync, không cần await, an toàn khi getSolarDate lỗi
 *
 * @param {number} month  1-based
 * @param {number} year
 * @returns {string}
 */
export const getSeasonContext = (month, year) => {
  const parts = [];

  // 1. Base context theo tháng
  parts.push(BASE_CONTEXT[month] || `Tháng ${month} không có đặc điểm mùa vụ nổi bật.`);

  // 2. Tết Nguyên Đán — 1/1 âm lịch, tự tính dương lịch
  const tet = toSolar(1, 1, year);
  if (tet) {
    if (tet.month === month) {
      parts.push(
        `TẾT NGUYÊN ĐÁN ${year} rơi ngày ${tet.day}/${tet.month} dương lịch — ` +
        `tuần trước Tết là đỉnh booking cả năm, tuần sau giảm 40-60% do khách đang nghỉ và thăm hỏi.`
      );
    } else if (tet.month === month + 1) {
      parts.push(
        `Tết Nguyên Đán ${year} rơi đầu tháng ${tet.month} tới — ` +
        `cuối tháng ${month} này là cao điểm chuẩn bị Tết, khách tăng mạnh để chỉnh tóc trước kỳ nghỉ.`
      );
    } else if (tet.month === month - 1) {
      parts.push(
        `Tết Nguyên Đán ${year} vừa qua tháng ${tet.month} — ` +
        `tháng ${month} đang phục hồi, booking dần về mức bình thường.`
      );
    }
  }

  // 3. Giỗ Tổ Hùng Vương — 10/3 âm lịch, tự tính dương lịch
  const hungKings = toSolar(10, 3, year);
  if (hungKings && hungKings.month === month) {
    parts.push(
      `Giỗ Tổ Hùng Vương ${year} rơi ngày ${hungKings.day}/${month} dương lịch — ` +
      `nghỉ lễ 1 ngày, thường tạo booking nhỏ 1-2 ngày trước đó.`
    );
  }

  // 4. Thất Tịch — 7/7 âm lịch (không nghỉ nhưng nhu cầu làm đẹp tăng)
  const thatTich = toSolar(7, 7, year);
  if (thatTich && thatTich.month === month) {
    parts.push(
      `Ngày Thất Tịch (Valentine Á Đông) ${year} rơi ngày ${thatTich.day}/${month} — ` +
      `không nghỉ lễ nhưng nhu cầu làm đẹp và tạo kiểu tăng rõ rệt.`
    );
  }

  // 5. Rằm Tháng Giêng — 15/1 âm lịch (ngày đông khách cúng, ảnh hưởng booking)
  const ramThangGieng = toSolar(15, 1, year);
  if (ramThangGieng && ramThangGieng.month === month) {
    parts.push(
      `Rằm Tháng Giêng ${year} rơi ngày ${ramThangGieng.day}/${month} — ` +
      `nhiều người đi chùa, booking có thể thấp hơn bình thường trong ngày này.`
    );
  }

  // 6. Ngày lễ cố định dương lịch của tháng
  FIXED_HOLIDAYS
    .filter((h) => h.month === month)
    .forEach((h) => {
      parts.push(`${h.name} (${h.day}/${month}): ${h.impact}`);
    });

  return parts.join(" ");
};
"use strict";

import moment from "moment";

const TODAY = moment("2026-05-16");
const LAST_MONTH_START = moment("2026-04-01");
const LAST_MONTH_END = moment("2026-04-30");
const CURRENT_MONTH_START = TODAY.clone().startOf('month');
const CURRENT_MONTH_END = TODAY;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomTotal() {
  // Doanh thu từ 200k đến 3 triệu, nghiêng về mức trung bình 800k
  const bases = [250000, 350000, 450000, 600000, 800000, 1200000, 1800000, 2500000];
  return bases[Math.floor(Math.random() * bases.length)];
}

export async function up(queryInterface, Sequelize) {
  const allBookings = [];
  const barberIds = [15, 16, 17, 18, 19, 20, 21, 22, 23];

  // Hàm để tạo booking cho một khách
  function createBookings(customerId, segmentType, customLastBookingDate = null) {
    const bookings = [];
    let bookingCount = 0;
    let lastDate = null;

    switch (segmentType) {
      case 'new':
        bookingCount = 1;
        lastDate = randomDate(CURRENT_MONTH_START.toDate(), CURRENT_MONTH_END.toDate());
        break;
      case 'regular':
        bookingCount = randomInt(4, 10);
        lastDate = randomDate(TODAY.clone().subtract(44, 'days').toDate(), TODAY.toDate());
        break;
      case 'occasional':
        bookingCount = randomInt(2, 4);
        lastDate = randomDate(TODAY.clone().subtract(89, 'days').toDate(), TODAY.clone().subtract(46, 'days').toDate());
        break;
      case 'inactive':
        if (Math.random() < 0.3) {
          bookingCount = 0;
        } else {
          bookingCount = randomInt(1, 6);
          lastDate = randomDate(new Date(2025, 0, 1), TODAY.clone().subtract(91, 'days').toDate());
        }
        break;
      default:
        break;
    }

    if (bookingCount === 0) return [];

    // Sinh ngày
    const dates = [];
    if (bookingCount === 1) {
      dates.push(lastDate);
    } else {
      const firstDate = randomDate(new Date(2025, 0, 1), lastDate);
      const step = (lastDate.getTime() - firstDate.getTime()) / (bookingCount - 1);
      for (let i = 0; i < bookingCount; i++) {
        dates.push(new Date(firstDate.getTime() + i * step));
      }
      dates.sort((a,b) => a-b);
    }

    for (const d of dates) {
      const bookingDay = moment(d);
      const total = randomTotal();
      bookings.push({
        idCustomer: customerId,
        idBarber: barberIds[randomInt(0, barberIds.length-1)],
        idCustomerVoucher: null,
        guestCount: randomInt(1, 3),
        bookingDate: bookingDay.format("YYYY-MM-DD"),
        bookingTime: `${randomInt(8,20)}:${randomInt(0,59).toString().padStart(2,'0')}`,
        status: "Completed",
        description: "Booking từ seed",
        total: total,
        isPaid: Math.random() > 0.1,
        paymentMethod: Math.random() > 0.4 ? "Transfer" : "Cash",
        createdAt: d,
        updatedAt: d,
      });
    }
    return bookings;
  }

  // 1. 10 khách cũ (ID 2-11) - tạo random không theo tỷ lệ, giữ dữ liệu đa dạng
  for (let id = 2; id <= 11; id++) {
    const typeRand = Math.random();
    let seg = 'occasional';
    if (id <= 4) seg = 'regular';
    else if (id >= 9) seg = 'inactive';
    else if (id === 7 || id === 8) seg = 'new';
    else seg = 'occasional';
    const bookings = createBookings(id, seg);
    allBookings.push(...bookings);
  }

  // 2. 200 khách mới (ID 24-223) - phân bố theo tỷ lệ mong muốn
  // Target: New ~15, Regular ~45, Occasional ~70, Inactive ~70 (tổng 200)
  const targetSegments = [];
  for (let i = 0; i < 15; i++) targetSegments.push('new');
  for (let i = 0; i < 45; i++) targetSegments.push('regular');
  for (let i = 0; i < 70; i++) targetSegments.push('occasional');
  for (let i = 0; i < 70; i++) targetSegments.push('inactive');
  // Shuffle
  for (let i = targetSegments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targetSegments[i], targetSegments[j]] = [targetSegments[j], targetSegments[i]];
  }

  let idx = 0;
  for (let id = 24; id <= 223; id++) {
    const seg = targetSegments[idx % targetSegments.length];
    const bookings = createBookings(id, seg);
    allBookings.push(...bookings);
    idx++;
  }

  // Bulk insert
  const chunkSize = 500;
  for (let i = 0; i < allBookings.length; i += chunkSize) {
    await queryInterface.bulkInsert("bookings", allBookings.slice(i, i + chunkSize));
  }
  console.log(`✅ Seeded ${allBookings.length} bookings for all customers`);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("bookings", null, {});
}
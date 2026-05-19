"use strict";

// Map chuẩn xác với avgRating bên file 09-salaries để đồng bộ test data hiển thị
const BARBER_RATING_PROFILE = {
  // Master
  36: { avgRate: 4.85, totalRate: 450 },
  46: { avgRate: 4.83, totalRate: 460 },
  56: { avgRate: 4.87, totalRate: 445 },
  
  // Senior (lên từ Junior Jul/2025)
  37: { avgRate: 4.75, totalRate: 320 },
  47: { avgRate: 4.78, totalRate: 330 },
  57: { avgRate: 4.72, totalRate: 315 },
  
  // Senior (lên từ Junior Oct/2025)
  38: { avgRate: 4.82, totalRate: 380 },
  48: { avgRate: 4.85, totalRate: 390 },
  58: { avgRate: 4.80, totalRate: 375 },
  
  // Senior Branch 4
  66: { avgRate: 4.73, totalRate: 310 },

  // Junior active (đạt thưởng)
  39: { avgRate: 4.60, totalRate: 250 },
  40: { avgRate: 4.62, totalRate: 260 },
  41: { avgRate: 4.58, totalRate: 240 },
  42: { avgRate: 4.55, totalRate: 230 },
  49: { avgRate: 4.65, totalRate: 270 },
  50: { avgRate: 4.60, totalRate: 250 },
  51: { avgRate: 4.57, totalRate: 240 },
  52: { avgRate: 4.52, totalRate: 220 },
  59: { avgRate: 4.61, totalRate: 260 },
  60: { avgRate: 4.59, totalRate: 250 },
  61: { avgRate: 4.56, totalRate: 240 },
  62: { avgRate: 4.53, totalRate: 230 },
  67: { avgRate: 4.55, totalRate: 220 },
  68: { avgRate: 4.52, totalRate: 210 },
  69: { avgRate: 4.50, totalRate: 200 },
  70: { avgRate: 4.55, totalRate: 190 },
  71: { avgRate: 4.52, totalRate: 180 },
  72: { avgRate: 4.50, totalRate: 170 },

  // Junior low rev (FAIL bonus)
  43: { avgRate: 4.20, totalRate: 150 },
  53: { avgRate: 4.15, totalRate: 140 },
  63: { avgRate: 4.10, totalRate: 130 },
  73: { avgRate: 4.05, totalRate: 120 },

  // Junior new (bắt đầu Oct 2025)
  44: { avgRate: 4.55, totalRate: 180 },
  54: { avgRate: 4.52, totalRate: 170 },
  64: { avgRate: 4.50, totalRate: 160 },
  74: { avgRate: 4.50, totalRate: 150 },

  // Junior newest (bắt đầu 2026)
  45: { avgRate: 4.50, totalRate: 80 },
  55: { avgRate: 4.45, totalRate: 75 },
  65: { avgRate: 4.40, totalRate: 70 },
  75: { avgRate: 4.35, totalRate: 65 },
};

export async function up(queryInterface, Sequelize) {
  // Lấy danh sách ID thật từ database
  const barbers = await queryInterface.sequelize.query(
    `SELECT idBarber FROM barbers`, 
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  const ratingData = barbers.map((b) => {
    const id = Number(b.idBarber);
    // Nếu ID có trong file lương thì dùng số liệu cố định, nếu không thì fallback về random
    const profile = BARBER_RATING_PROFILE[id];

    return {
      idBarber: id,
      totalRate: profile ? profile.totalRate : Math.floor(Math.random() * 50) + 10,
      avgRate: profile ? profile.avgRate : parseFloat((Math.random() * 1.5 + 3.5).toFixed(2)),
    };
  });

  if (ratingData.length > 0) {
    await queryInterface.bulkInsert("barber_rating_summaries", ratingData);
    console.log(`✅ Seeded ratings cho ${ratingData.length} barbers đồng bộ với lương`);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("barber_rating_summaries", null, {});
}
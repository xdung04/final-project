"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("barbers", [
    // ── Branch 1 ──
    {
      idBarber: 15,
      idBranch: 1,
      profileDescription: `- Kinh nghiệm: 6 năm trong các kiểu tóc nam hiện đại\n- Chuyên môn: Fade, undercut, pompadour, tạo kiểu râu\n- Phong cách: Thời thượng, gọn gàng\n- Chứng chỉ: BarberPro Level 2, Giải HairShow 2022\n- Triết lý: Luôn lắng nghe mong muốn khách hàng và nâng tầm phong cách cá nhân`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 16,
      idBranch: 1,
      profileDescription: `- Kinh nghiệm: 5 năm trong tóc nữ và tạo kiểu\n- Chuyên môn: Nhuộm, uốn, cắt tóc hiện đại\n- Phong cách: Sáng tạo, thanh lịch\n- Chứng chỉ: ColorMaster Certification, HairArt 2021\n- Triết lý: Biến đổi diện mạo trong khi vẫn giữ tóc khỏe mạnh`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 17,
      idBranch: 1,
      profileDescription: `- Kinh nghiệm: 4 năm trong cắt tóc và chăm sóc tóc\n- Chuyên môn: Cắt tóc nhanh, gọn, an toàn\n- Phong cách: Thân thiện, kiên nhẫn, chuyên nghiệp\n- Chứng chỉ: HairCut Workshop Level 1\n- Triết lý: Biến trải nghiệm cắt tóc thành niềm vui`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // ── Branch 2 ──
    {
      idBarber: 18,
      idBranch: 2,
      profileDescription: `- Kinh nghiệm: 7 năm trong chăm sóc tóc và râu nam\n- Chuyên môn: Tạo kiểu râu, cắt tóc cổ điển, fade\n- Phong cách: Chi tiết, chính xác, gọn gàng\n- Chứng chỉ: Master Barber Certificate, Grooming Expo 2023\n- Triết lý: Độ chính xác và phong cách trong từng đường cắt`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 19,
      idBranch: 2,
      profileDescription: `- Kinh nghiệm: 5 năm trong nhuộm và tạo kiểu tóc nữ\n- Chuyên môn: Highlights, balayage, uốn xoăn\n- Phong cách: Sáng tạo, thanh lịch\n- Chứng chỉ: HairColor Specialist, International HairShow 2022\n- Triết lý: Tôn vinh vẻ đẹp tự nhiên và giữ tóc khỏe mạnh`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 20,
      idBranch: 2,
      profileDescription: `- Kinh nghiệm: 6 năm trong tạo kiểu chuyên nghiệp\n- Chuyên môn: Uốn, duỗi, cắt tóc hiện đại\n- Phong cách: Thời thượng, linh hoạt\n- Chứng chỉ: Hair Styling Advanced Diploma\n- Triết lý: Mỗi khách hàng xứng đáng có kiểu tóc cá nhân hóa`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    // ── Branch 3 ──
    {
      idBarber: 21,
      idBranch: 3,
      profileDescription: `- Kinh nghiệm: 8 năm trong tóc nam\n- Chuyên môn: Cắt cổ điển, fade, chăm sóc râu\n- Phong cách: Gọn gàng, phong độ, nam tính\n- Chứng chỉ: BarberPro Level 3, MaleStyle 2021\n- Triết lý: Giúp mỗi người đàn ông trông sắc sảo và tự tin`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 22,
      idBranch: 3,
      profileDescription: `- Kinh nghiệm: 5 năm trong cắt và tạo kiểu tóc nữ\n- Chuyên môn: Cắt hiện đại, layer, kiểu thanh lịch\n- Phong cách: Thanh lịch, tỉ mỉ\n- Chứng chỉ: HairCutting Excellence, StylePro 2022\n- Triết lý: Vẻ đẹp nằm trong những chi tiết nhỏ`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 23,
      idBranch: 3,
      profileDescription: `- Kinh nghiệm: 4 năm trong cắt tóc và tạo kiểu\n- Chuyên môn: An toàn, nhanh chóng, tạo kiểu đa dạng\n- Phong cách: Thân thiện, gần gũi\n- Chứng chỉ: Hair Styling Certification\n- Triết lý: Cắt tóc nên là trải nghiệm vui và thoải mái`,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("barbers", null, {});
}

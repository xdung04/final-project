"use strict";
import slugify from "slugify";

export async function up(queryInterface, Sequelize) {
  // 1. Chèn dữ liệu vào bảng "categories" trước để làm khóa ngoại
  const categories = [
    { idCategory: 1, name: "Modern", status: "Active" },
    { idCategory: 2, name: "Classic", status: "Active" },
    { idCategory: 3, name: "Korean", status: "Active" },
    { idCategory: 4, name: "Fade", status: "Active" },
  ];

  const finalCategories = categories.map(cat => ({
    ...cat,
    slug: slugify(cat.name, { lower: true, locale: "vi" }),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await queryInterface.bulkInsert("categories", finalCategories);

  // 2. Chèn dữ liệu 19 kiểu tóc vào bảng "hairstyles" (Khớp 100% các cột với Migration)
  const hairstyles = [
    {
      idCategory: 1,
      name: "Textured Quiff",
      shortDescription: "Kiểu tóc vuốt quiff tạo cấu trúc lọn tự nhiên, trẻ trung và năng động.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "18-30",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779174883/HS001_douzch.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779175146/Screenshot_2026-05-19_at_14.18.34_cwm270.png",
    },
    {
      idCategory: 2,
      name: "Side Part Classic",
      shortDescription: "Kiểu tóc rẽ ngôi cổ điển lịch lãm, đường chia ngôi rõ ràng, tôn vẻ lịch sự.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "25-45",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779177840/Screenshot_2026-05-19_at_14.22.38_obxdyd.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779177839/Screenshot_2026-05-19_at_14.53.49_shxfk4.png",
    },
    {
      idCategory: 3,
      name: "Two Block",
      shortDescription: "Kiểu tóc hai khối đặc trưng Hàn Quốc, phần mái dài thanh lịch, hai bên cắt ngắn.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Medium",
      suitableAge: "15-28",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779177838/Screenshot_2026-05-19_at_15.02.59_oxdwhc.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779178038/Screenshot_2026-05-19_at_15.07.01_n90i3s.png",
    },
    {
      idCategory: 3,
      name: "Comma Hair",
      shortDescription: "Kiểu tóc dấu phẩy Hàn Quốc, phần mái uốn cong chữ C tạo điểm nhấn độc đáo.",
      difficultyLevel: "Medium",
      maintenanceLevel: "High",
      suitableAge: "16-30",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779177840/Screenshot_2026-05-19_at_14.57.51_ul7azy.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779177838/Screenshot_2026-05-19_at_14.55.40_b6u6nt.png",
    },
    {
      idCategory: 4,
      name: "Low Fade Textured Crop",
      shortDescription: "Kiểu tóc mái ngố cắt ngắn tạo texture kết hợp hiệu ứng Low Fade sành điệu.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "18-28",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779178230/Screenshot_2026-05-19_at_15.09.26_ycyzi2.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779178227/Screenshot_2026-05-19_at_15.09.59_inva0k.png",
    },
    {
      idCategory: 4,
      name: "Mid Fade Pompadour",
      shortDescription: "Kiểu tóc Pompadour vuốt phồng quyến rũ kết hợp Mid Fade phần sườn sắc nét.",
      difficultyLevel: "Hard",
      maintenanceLevel: "High",
      suitableAge: "20-35",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779178531/Screenshot_2026-05-19_at_15.14.53_yydk3e.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779178533/Screenshot_2026-05-19_at_15.14.20_yommlz.png",
    },
    {
      idCategory: 4,
      name: "High Skin Fade",
      shortDescription: "Kiểu tóc cạo sát da hông cao, tạo vẻ ngoài gọn gàng, mạnh mẽ và nam tính.",
      difficultyLevel: "Medium",
      maintenanceLevel: "High",
      suitableAge: "18-32",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179060/Screenshot_2026-05-19_at_15.19.50_bbj6di.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779178902/Screenshot_2026-05-19_at_15.19.09_x4xmss.png",
    },
    {
      idCategory: 3,
      name: "Shadow Perm",
      shortDescription: "Kiểu tóc uốn xoăn sóng nhẹ nhàng tạo độ phồng tự nhiên và phong cách lãng tử.",
      difficultyLevel: "Hard",
      maintenanceLevel: "High",
      suitableAge: "16-28",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179061/Screenshot_2026-05-19_at_15.20.38_lldgp9.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179063/Screenshot_2026-05-19_at_15.21.16_q7pqsi.png",
    },
    {
      idCategory: 1,
      name: "Mullet Modern",
      shortDescription: "Kiểu tóc gáy dài cá tính độc đáo kết hợp phần sườn tỉa gọn gàng hiện đại.",
      difficultyLevel: "Hard",
      maintenanceLevel: "High",
      suitableAge: "16-26",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179418/Screenshot_2026-05-19_at_15.26.16_mj0p7b.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179417/Screenshot_2026-05-19_at_15.26.06_jttvai.png",
    },
    {
      idCategory: 1,
      name: "Buzz Cut",
      shortDescription: "Kiểu tóc đầu đinh tối giản, cắt sát da đầu, vô cùng nam tính và không tốn công.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "18-35",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179420/Screenshot_2026-05-19_at_15.27.37_pfdcpc.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179419/Screenshot_2026-05-19_at_15.28.10_pmowgb.png",
    },
    {
      idCategory: 2,
      name: "Crew Cut",
      shortDescription: "Kiểu tóc ngắn cổ điển phong cách quân đội, phần đỉnh dài hơn sườn một chút.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "20-40",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179709/Screenshot_2026-05-19_at_15.34.19_rf75rk.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179710/Screenshot_2026-05-19_at_15.34.35_nwoxy6.png",
    },
    {
      idCategory: 2,
      name: "Slick Back Classic",
      shortDescription: "Kiểu tóc vuốt ngược toàn bộ về sau mượt mà bằng pomade cho quý ông.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Medium",
      suitableAge: "25-50",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179795/Screenshot_2026-05-19_at_15.35.58_hyihz9.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179796/Screenshot_2026-05-19_at_15.36.08_nekxgn.png",
    },
    {
      idCategory: 1,
      name: "Faux Hawk",
      shortDescription: "Kiểu tóc vuốt dựng chỏm giữa tập trung đỉnh đầu, đầy năng động và phá cách.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "18-30",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180004/Screenshot_2026-05-19_at_15.39.47_cbdums.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180002/Screenshot_2026-05-19_at_15.39.19_kdh8ui.png",
    },
    {
      idCategory: 3,
      name: "Leaf Cut",
      shortDescription: "Kiểu tóc mái dài rủ hai bên như hình chiếc lá mềm mại, đậm chất nghệ sĩ.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "18-28",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180864/Screenshot_2026-05-19_at_15.52.29_y3a8mv.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180864/Screenshot_2026-05-19_at_15.54.02_htrspg.png",
    },
    {
      idCategory: 4,
      name: "Taper Fade Slick Back",
      shortDescription: "Kiểu tóc vuốt ngược kết hợp sườn mờ dần Taper Fade nhẹ nhàng, thanh lịch.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "22-38",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180863/Screenshot_2026-05-19_at_15.50.35_spfhgy.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180862/Screenshot_2026-05-19_at_15.48.34_zw6v1o.png",
    },
    {
      idCategory: 1,
      name: "Spiky Modern",
      shortDescription: "Kiểu tóc vuốt dựng từng lọn nhọn cá tính, tạo cảm giác khỏe khoắn, thể thao.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Medium",
      suitableAge: "15-25",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181504/Screenshot_2026-05-19_at_15.58.32_h6gnkj.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181193/Screenshot_2026-05-19_at_15.59.35_zqjfxv.png",
    },
    {
      idCategory: 2,
      name: "French Crop",
      shortDescription: "Kiểu tóc mái bằng phẳng đặc trưng, sườn cắt ngắn gọn gàng tối giản.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "18-30",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181941/Screenshot_2026-05-19_at_16.01.08_qwoziz.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181940/Screenshot_2026-05-19_at_16.00.44_mhwgx0.png",
    },
    {
      idCategory: 2,
      name: "Ivy League",
      shortDescription: "Kiểu tóc ngắn lịch lãm phong cách sinh viên Mỹ, vuốt lệch nhẹ mái sang một bên.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "18-35",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181942/Screenshot_2026-05-19_at_16.04.05_ie21np.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181941/Screenshot_2026-05-19_at_16.04.46_njsyek.png",
    },
    {
      idCategory: 4,
      name: "Burst Fade Mohawk",
      shortDescription: "Kiểu tóc Mohawk phá cách kết hợp hiệu ứng Burst Fade bo tròn quanh vành tai.",
      difficultyLevel: "Hard",
      maintenanceLevel: "High",
      suitableAge: "16-25",
      status: "Active",
      coverImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181943/Screenshot_2026-05-19_at_16.05.30_gwtv4c.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181944/Screenshot_2026-05-19_at_16.10.51_q17neq.png",
    }
  ];

  // Tự động map thêm slug và timestamps (createdAt, updatedAt) theo đúng thiết kế database
  const finalHairstyles = hairstyles.map((item) => ({
    ...item,
    slug: slugify(item.name, { lower: true, locale: "vi" }),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await queryInterface.bulkInsert("hairstyles", finalHairstyles);
}

export async function down(queryInterface, Sequelize) {
  // Khi rollback seeder: xóa bảng con (hairstyles) trước rồi xóa bảng cha (categories)
  await queryInterface.bulkDelete("hairstyles", null, {});
  await queryInterface.bulkDelete("categories", null, {});
}
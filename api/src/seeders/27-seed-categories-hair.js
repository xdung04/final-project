"use strict";
import slugify from "slugify";

export async function up(queryInterface, Sequelize) {
  const categories = [
    { idCategory: 1, name: "Tóc Ngắn", status: "Active" },
    { idCategory: 2, name: "Tóc Vuốt", status: "Active" },
    { idCategory: 3, name: "Cổ Điển", status: "Active" },
    { idCategory: 4, name: "Cá Tính", status: "Active" },
  ];

  const finalCategories = categories.map(cat => ({
    ...cat,
    slug: slugify(cat.name, { lower: true, locale: "vi" }),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await queryInterface.bulkInsert("categories", finalCategories);

  const hairstyles = [
    // ===== Tóc Ngắn (idCategory: 1) =====
    {
      idCategory: 1,
      name: "Buzz Cut",
      shortDescription: "Kiểu tóc đầu đinh tối giản, cắt sát da đầu, vô cùng nam tính và không tốn công.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "18-35",
      suitableFaceShapes: JSON.stringify(["ovale", "square", "oblong"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783762043/Buzz-Cut-1-_aiyogw.jpg",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179419/Screenshot_2026-05-19_at_15.28.10_pmowgb.png",
    },
    {
      idCategory: 1,
      name: "Crew Cut",
      shortDescription: "Kiểu tóc ngắn cổ điển phong cách quân đội, phần đỉnh dài hơn sườn một chút.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "20-40",
      suitableFaceShapes: JSON.stringify(["ovale", "square", "oblong", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783762026/Crew-Cut-1-_danoq2.jpg",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179710/Screenshot_2026-05-19_at_15.34.35_nwoxy6.png",
    },
    {
      idCategory: 1,
      name: "French Crop",
      shortDescription: "Kiểu tóc mái bằng phẳng đặc trưng, sườn cắt ngắn gọn gàng tối giản.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "18-30",
      suitableFaceShapes: JSON.stringify(["ovale", "round", "oblong"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169568/French-Crop-1-_l8t9wn.jpg",
      sideImage: "https://res.cloudinary.com/xuandung/image/upload/v1783327893/c018dd05-45a2-48f0-9846-8308a2d1fab9.png",
    },
    {
      idCategory: 1,
      name: "Ivy League",
      shortDescription: "Kiểu tóc ngắn lịch lãm phong cách sinh viên Mỹ, vuốt lệch nhẹ mái sang một bên.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "18-35",
      suitableFaceShapes: JSON.stringify(["ovale", "oblong", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169568/Ivy-League-1-_wewmlg.jpg",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181941/Screenshot_2026-05-19_at_16.04.46_njsyek.png",
    },
    {
      idCategory: 1,
      name: "Messy Crop",
      shortDescription: "Kiểu tóc mái ngố được cắt ngắn đánh rối tạo texture tự nhiên, cá tính và không cần chải chuốt.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Medium",
      suitableAge: "16-28",
      suitableFaceShapes: JSON.stringify(["ovale", "square", "oblong"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169569/Messy-Crop_mohawk_jsegbx.webp",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779181944/Screenshot_2026-05-19_at_16.10.51_q17neq.png",
    },

    // ===== Tóc Vuốt (idCategory: 2) =====
    {
      idCategory: 2,
      name: "Short Quiff",
      shortDescription: "Kiểu tóc ngắn được tỉa gọn và vuốt nhẹ phần mái ra trước, mang phong cách trẻ trung và thanh lịch.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "18-35",
      suitableFaceShapes: JSON.stringify(["ovale", "square", "round", "oblong"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169570/Short-Quiff_Perm_evh2wv.jpg",
      sideImage: "https://res.cloudinary.com/xuandung/image/upload/v1783327691/f07cd6a1-7259-4348-84f4-403291571bb1.png",
    },
    {
      idCategory: 2,
      name: "Faux Hawk",
      shortDescription: "Kiểu tóc vuốt dựng chỏm giữa tập trung đỉnh đầu, đầy năng động và phá cách.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "18-30",
      suitableFaceShapes: JSON.stringify(["round", "square", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783759867/Faux-Hawk_z8y29r.jpg",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180002/Screenshot_2026-05-19_at_15.39.19_kdh8ui.png",
    },

    // ===== Cổ Điển (idCategory: 3) =====
    {
      idCategory: 3,
      name: "Side Part Classic",
      shortDescription: "Kiểu tóc rẽ ngôi cổ điển lịch lãm, đường chia ngôi rõ ràng, tôn vẻ lịch sự.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Low",
      suitableAge: "25-45",
      suitableFaceShapes: JSON.stringify(["ovale", "round", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169571/Side-Part-Classic_dlz5ly.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779177839/Screenshot_2026-05-19_at_14.53.49_shxfk4.png",
    },
    {
      idCategory: 3,
      name: "Slick Back",
      shortDescription: "Kiểu tóc vuốt ngược kết hợp sườn mờ dần Taper Fade nhẹ nhàng, thanh lịch.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "22-38",
      suitableFaceShapes: JSON.stringify(["ovale", "oblong", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169571/Taper-Fade-Slick-Back_ptiulj.png",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180862/Screenshot_2026-05-19_at_15.48.34_zw6v1o.png",
    },
    {
      idCategory: 3,
      name: "Pretty Boy 90s",
      shortDescription: "Kiểu tóc rủ bổ luống hoặc uốn nhẹ lãng mạn đặc trưng thập niên 90, thanh lịch và cuốn hút.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "16-30",
      suitableFaceShapes: JSON.stringify(["ovale", "oblong", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169569/90s-Pretty-Boy_lowfadecrop_czrsol.png",
      sideImage: "https://res.cloudinary.com/xuandung/image/upload/v1783327831/67ceecd2-0242-4dc5-86a6-8f6aa864c2de.png",
    },

    // ===== Cá Tính (idCategory: 4) =====
    {
      idCategory: 4,
      name: "Mullet Modern",
      shortDescription: "Kiểu tóc gáy dài cá tính độc đáo kết hợp phần sườn tỉa gọn gàng hiện đại.",
      difficultyLevel: "Hard",
      maintenanceLevel: "High",
      suitableAge: "16-26",
      suitableFaceShapes: JSON.stringify(["oval", "square", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169570/Mullet-Modern-1-_b7m8j7.jpg",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779179417/Screenshot_2026-05-19_at_15.26.06_jttvai.png",
    },
    {
      idCategory: 4,
      name: "Two Block",
      shortDescription: "Kiểu tóc hai khối đặc trưng Hàn Quốc, phần mái dài thanh lịch, hai bên cắt ngắn.",
      difficultyLevel: "Easy",
      maintenanceLevel: "Medium",
      suitableAge: "15-28",
      suitableFaceShapes: JSON.stringify(["ovale", "round", "heart", "square"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169571/Two-Block_uu8llu.jpg",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779178038/Screenshot_2026-05-19_at_15.07.01_n90i3s.png",
    },
    {
      idCategory: 4,
      name: "Leaf Cut",
      shortDescription: "Kiểu tóc mái dài rủ hai bên như hình chiếc lá mềm mại, đậm chất nghệ sĩ.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "18-28",
      suitableFaceShapes: JSON.stringify(["square", "oblong", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783169569/Leaf-Cut-1-_hy0twh.jpg",
      sideImage: "https://res.cloudinary.com/dewjxowhs/image/upload/v1779180864/Screenshot_2026-05-19_at_15.54.02_htrspg.png",
    },
    {
      idCategory: 4,
      name: "Undercut",
      shortDescription: "Kiểu tóc Undercut cá tính với phần sườn và gáy cạo sát, phần đỉnh để dài vuốt ngược hoặc rẽ ngôi.",
      difficultyLevel: "Medium",
      maintenanceLevel: "Medium",
      suitableAge: "18-35",
      suitableFaceShapes: JSON.stringify(["ovale", "square", "oblong", "heart"]),
      status: "Active",
      coverImage: "https://res.cloudinary.com/xuandung/image/upload/v1783762042/Undercut_lfvigh.jpg",
      sideImage: "https://res.cloudinary.com/xuandung/image/upload/v1783762310/1b42b32b209aa2f3988716e4021073c4_uhhl0g.jpg",
    }
  ];

  const finalHairstyles = hairstyles.map((item) => ({
    ...item,
    slug: slugify(item.name, { lower: true, locale: "vi" }),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await queryInterface.bulkInsert("hairstyles", finalHairstyles);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("hairstyles", null, {});
  await queryInterface.bulkDelete("categories", null, {});
}
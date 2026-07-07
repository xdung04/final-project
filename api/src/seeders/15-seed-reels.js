"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("reels", [
    // ── REEL 1 (giữ nguyên idBarber 36, thêm hashtag) ─────────────────────
    {
      idBarber: 36,
      title: "Cắt Fade chuẩn - Kỹ thuật blend mượt mà #Fade #BarberStyle #ClassicMen",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1761365338/reels/qgpm8q5hmnkkps8nnusl.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1761365338/reels/qgpm8q5hmnkkps8nnusl.jpg",
      description: "Kỹ thuật fade mượt mà, blend đều và sạch.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ── REEL 2 (sửa idBarber 37, bỏ tóc nữ, thêm hashtag) ────────────────
    {
      idBarber: 37,
      title: "Layer Cut nam tính - Phong cách hiện đại cho phái mạnh #LayerCut #StylePro #Highlight",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1761365409/reels/yvchoyhllajhix6i2u10.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1761365409/reels/yvchoyhllajhix6i2u10.jpg",
      description: "Cắt layer tinh tế, tạo độ phồng tự nhiên cho tóc nam.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ── REEL 3 (giữ nguyên idBarber 38, thêm hashtag) ─────────────────────
    {
      idBarber: 38,
      title: "Tạo kiểu râu đẹp - Phong cách cổ điển nam tính #BeardTrim #ClassicMen #Fade",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1761365472/reels/ts4xl9lmnjdbxeb8ebfl.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1761365472/reels/ts4xl9lmnjdbxeb8ebfl.jpg",
      description: "Đường cắt tinh tế, phong cách cổ điển nam tính.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ── REEL 4 (giữ nguyên idBarber 39, thêm hashtag) ─────────────────────
    {
      idBarber: 39,
      title: "Nhuộm Highlight siêu đẹp - Màu sắc cá tính #Highlight #StylePro #WavyHair",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1761365442/reels/nrtfehbptaaale4nswvb.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1761365442/reels/nrtfehbptaaale4nswvb.jpg",
      description: "Highlight tóc tạo điểm nhấn nổi bật, chuyên nghiệp.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ── REEL 5 (sửa idBarber 40→36, thêm hashtag) ────────────────────────
    {
      idBarber: 36,
      title: "Uốn xoăn sóng nước - Tạo kiểu tự nhiên bồng bềnh #WavyHair #LayerCut #FunBarber",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1761365338/reels/qgpm8q5hmnkkps8nnusl.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1761365338/reels/qgpm8q5hmnkkps8nnusl.jpg",
      description: "Uốn xoăn sóng nước tự nhiên, bồng bềnh cuốn hút.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ══════════════════════════════════════════════════════════════════════
    // REEL 6-19: idBarber luân phiên 36→37→38→39→36→37→38→39→36→37→38→39→36→37
    // Mỗi reel 3 hashtag duy nhất, không trùng tổ hợp
    // ══════════════════════════════════════════════════════════════════════
    {
      idBarber: 36,
      title: "Kỹ thuật Fade kết hợp râu - Tổng thể nam tính hoàn hảo #Fade #StylePro #BeardTrim",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783417921/reels/vzmfblvngtnj3x5oy4x7.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783417921/reels/vzmfblvngtnj3x5oy4x7.jpg",
      description: "Kết hợp fade mượt và râu tạo tổng thể nam tính, mạnh mẽ.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 37,
      title: "BarberStyle Layer Cut - Kiểu tóc được yêu thích nhất năm 2026 #BarberStyle #LayerCut #Highlight",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783417946/reels/hpxdvrffbckm4kj1nywa.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783417946/reels/hpxdvrffbckm4kj1nywa.jpg",
      description: "Cắt layer kết hợp highlight tạo điểm nhấn cá tính.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 38,
      title: "Classic Men sóng nước - Phong cách lịch lãm quý ông #ClassicMen #WavyHair #FunBarber",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783417989/reels/wqctfycvzjhbo8bnt8uy.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783417989/reels/wqctfycvzjhbo8bnt8uy.jpg",
      description: "Kết hợp cổ điển và sóng nước tạo phong cách độc đáo.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 39,
      title: "Fade kết hợp Highlight - Cá tính và nổi bật #Fade #Highlight #FunBarber",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418011/reels/ipmamrijdysfal9tvlur.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418011/reels/ipmamrijdysfal9tvlur.jpg",
      description: "Fade mượt kết hợp highlight tạo điểm nhấn cho mái tóc.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 36,
      title: "BarberStyle râu sóng nước - Đẳng cấp quý ông hiện đại #BarberStyle #BeardTrim #WavyHair",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418030/reels/ivltawmphqhpsp14s942.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418030/reels/ivltawmphqhpsp14s942.jpg",
      description: "Tạo kiểu râu kết hợp sóng nước, phong cách quý ông.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 37,
      title: "LayerCut Classic Men - Thanh lịch và hiện đại #LayerCut #ClassicMen #StylePro",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418058/reels/xtklvj9pqajgxeff0v63.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418058/reels/xtklvj9pqajgxeff0v63.jpg",
      description: "Cắt layer cổ điển pha hiện đại, phù hợp mọi lứa tuổi.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 38,
      title: "Fade sóng nước LayerCut - Kỹ thuật đỉnh cao #Fade #WavyHair #LayerCut",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418080/reels/dtdivfwhogmbdstn24fy.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418080/reels/dtdivfwhogmbdstn24fy.jpg",
      description: "Kết hợp fade, sóng nước và layer tạo kiểu tóc ấn tượng.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 39,
      title: "BarberStyle Highlight - Phong cách trẻ trung năng động #BarberStyle #Highlight #FunBarber",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418102/reels/apzrkbldidqqq5qdrg4f.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418102/reels/apzrkbldidqqq5qdrg4f.jpg",
      description: "Highlight cá tính kết hợp phong cách barber chuyên nghiệp.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 36,
      title: "StylePro râu cổ điển - Chuẩn barber chuyên nghiệp #StylePro #BeardTrim #ClassicMen",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418127/reels/eew1kcrzitthe3ehdhdg.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418127/reels/eew1kcrzitthe3ehdhdg.jpg",
      description: "Tỉa râu cổ điển chuẩn barber, tôn lên đường nét nam tính.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 37,
      title: "Fade LayerCut vui nhộn - Kiểu tóc cho bạn trẻ #Fade #LayerCut #FunBarber",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418171/reels/jrua9grgma8lnjtyxq2w.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418171/reels/jrua9grgma8lnjtyxq2w.jpg",
      description: "Fade kết hợp layer tạo kiểu tóc trẻ trung, năng động.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 38,
      title: "BarberStyle sóng nước Highlight - Xu hướng mới nhất 2026 #BarberStyle #WavyHair #Highlight",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418199/reels/u3v5ovxqnk8blgzw7hxb.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418199/reels/u3v5ovxqnk8blgzw7hxb.jpg",
      description: "Sóng nước kết hợp highlight tạo hiệu ứng màu sắc độc đáo.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 39,
      title: "ClassicMen râu chất - Phong cách quý ông lịch lãm #ClassicMen #FunBarber #BeardTrim",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418218/reels/pylsgu9xbgvyf4fielms.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418218/reels/pylsgu9xbgvyf4fielms.jpg",
      description: "Râu cổ điển phong cách quý ông, lịch lãm và nam tính.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 36,
      title: "Fade BarberStyle Highlight - Kết hợp hoàn hảo #Fade #BarberStyle #Highlight",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418238/reels/k4cfift1hxb97h3i5ck2.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418238/reels/k4cfift1hxb97h3i5ck2.jpg",
      description: "Fade chuẩn kết hợp highlight tạo phong cách barber đỉnh cao.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      idBarber: 37,
      title: "LayerCut sóng nước StylePro - Tự tin tỏa sáng #LayerCut #WavyHair #StylePro",
      url: "https://res.cloudinary.com/xuandung/video/upload/v1783418255/reels/rzodsihbzm2wril62h5s.mp4",
      thumbnail: "https://res.cloudinary.com/xuandung/video/upload/so_1/v1783418255/reels/rzodsihbzm2wril62h5s.jpg",
      description: "Sóng nước layer tạo độ phồng tự nhiên, phong cách chuyên nghiệp.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("reels", null, {});
}
"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 04 — barbers (40 thợ, 4 chi nhánh × 10)
//
// Mỗi chi nhánh có cùng cấu trúc cấp bậc:
//   x1  Master   — cấp cao nhất, làm từ 2024
//   x2  Senior   — đã lên cấp, làm từ 2024
//   x4  Junior   — đang active, đủ điều kiện xét lên Senior
//   x1  Junior   — đủ tháng nhưng doanh thu thấp → fail
//   x1  Junior   — chưa đủ tháng thâm niên → fail
//   x1  Junior   — mới nhất
// ════════════════════════════════════════════════════════════════════════════

const makeBarber = (id, branch, desc, exp, spec, style, cert, phil) => ({
  idBarber: id, idBranch: branch,
  profileDescription: desc, experienceYears: exp,
  specialty: spec, style, certificates: cert, philosophy: phil,
  isLocked: false, createdAt: new Date(), updatedAt: new Date(),
});

export async function up(queryInterface) {
  await queryInterface.bulkInsert("barbers", [

    // ════════════════════════════════════════════════════════════════════
    // BRANCH 1 — Quận 1 (idBarber 36 → 45)
    // ════════════════════════════════════════════════════════════════════
    makeBarber(36, 1, "Master barber chuyên fade và kiểu tóc cổ điển, 8 năm kinh nghiệm.", 8,
      "Fade, Classic Cut, Pompadour", "Chính xác, đẳng cấp",
      "Master Barber Certificate 2022, HairShow Champion 2021",
      "Mỗi đường kéo đều phải có mục đích."),

    makeBarber(37, 1, "Senior barber chuyên undercut và nhuộm tóc hiện đại.", 6,
      "Undercut, Nhuộm, Balayage", "Sáng tạo, thanh lịch",
      "ColorMaster Pro, Advanced Styling 2022",
      "Tóc đẹp bắt đầu từ sự tự tin của khách hàng."),

    makeBarber(38, 1, "Senior barber chuyên tạo kiểu râu và cắt tóc nam truyền thống.", 5,
      "Beard Styling, Classic Shave, Taper", "Tỉ mỉ, cổ điển",
      "Barber Pro Level 3, Grooming Expo 2023",
      "Sự chính xác là biểu hiện của sự tôn trọng."),

    makeBarber(39, 1, "Junior barber nhiệt tình, thành thạo fade và kiểu tóc Hàn Quốc.", 3,
      "Fade, Korean Style, Two-Block", "Trẻ trung, năng động",
      "Modern Barber Workshop 2023",
      "Luôn học hỏi để phục vụ tốt hơn."),

    makeBarber(40, 1, "Junior barber chuyên gội đầu và chăm sóc tóc cơ bản.", 2,
      "Cắt cơ bản, Gội đầu, Chăm sóc tóc", "Thân thiện, nhanh nhẹn",
      "Hair Care Basic Certificate",
      "Niềm vui của khách là động lực của tôi."),

    makeBarber(41, 1, "Junior barber đam mê tạo kiểu và uốn tóc.", 2,
      "Uốn, Duỗi, Tạo kiểu", "Linh hoạt, sáng tạo",
      "Styling Foundation Course 2024",
      "Mỗi kiểu tóc là một câu chuyện riêng."),

    makeBarber(42, 1, "Junior barber chuyên tóc nữ layer và highlight.", 2,
      "Layer, Highlight, Tóc nữ", "Tinh tế, tỉ mỉ",
      "Women Hair Specialist Workshop",
      "Vẻ đẹp nằm trong từng chi tiết."),

    makeBarber(43, 1, "Junior barber — doanh thu thấp, cần cải thiện kỹ năng.", 3,
      "Cắt tóc cơ bản", "Đang phát triển",
      "Basic Barber Certificate",
      "Đang nỗ lực cải thiện từng ngày."),

    makeBarber(44, 1, "Junior barber mới — chưa đủ 6 tháng thâm niên để xét lên cấp.", 1,
      "Cắt tóc cơ bản, Gội đầu", "Thân thiện",
      "Barber Foundation 2025",
      "Học hỏi từ các đàn anh mỗi ngày."),

    makeBarber(45, 1, "Junior barber mới nhất chi nhánh, đang trong giai đoạn đào tạo.", 0,
      "Cắt tóc cơ bản", "Nhiệt tình",
      "Đang đào tạo",
      "Bắt đầu hành trình barber chuyên nghiệp."),

    // ════════════════════════════════════════════════════════════════════
    // BRANCH 2 — Quận 3 (idBarber 46 → 55)
    // ════════════════════════════════════════════════════════════════════
    makeBarber(46, 2, "Master barber chuyên highlights và kỹ thuật nhuộm cao cấp.", 9,
      "Highlights, Balayage, Color Correction", "Chuyên nghiệp, tinh tế",
      "Color Expert Certification, International HairShow 2020",
      "Màu sắc là nghệ thuật, tóc là canvas."),

    makeBarber(47, 2, "Senior barber chuyên uốn xoăn và tóc nữ hiện đại.", 6,
      "Uốn xoăn, Perm, Tóc nữ layer", "Sáng tạo, thanh lịch",
      "Advanced Perm & Curl Specialist 2022",
      "Tóc xoăn đẹp là khi khách hàng tự tin nhất."),

    makeBarber(48, 2, "Senior barber thành thạo fade kỹ thuật cao và tạo kiểu râu.", 5,
      "Skin Fade, Beard Art, Taper Fade", "Hiện đại, chính xác",
      "Fade Master Workshop, Barber Elite 2023",
      "Fade hoàn hảo bắt đầu từ đường blend chuẩn."),

    makeBarber(49, 2, "Junior barber chuyên tóc Hàn và các kiểu trendy.", 3,
      "Korean Style, Perm, Modern Cut", "Trẻ trung, theo xu hướng",
      "K-Style Barber Course 2023",
      "Theo kịp xu hướng là trách nhiệm của barber hiện đại."),

    makeBarber(50, 2, "Junior barber nhiệt tình, hay smile với khách.", 2,
      "Cắt cơ bản, Gội, Tư vấn tóc", "Vui vẻ, thân thiện",
      "Customer Service & Barber Basic",
      "Nụ cười là dịch vụ tốt nhất."),

    makeBarber(51, 2, "Junior barber chuyên nhuộm và chăm sóc tóc hư tổn.", 2,
      "Nhuộm phục hồi, Keratin, Ủ tóc", "Chăm sóc, tỉ mỉ",
      "Hair Treatment Specialist",
      "Tóc khỏe mới đẹp bền."),

    makeBarber(52, 2, "Junior barber đang phát triển kỹ năng fade và styling.", 2,
      "Fade, Styling, Wax & Pomade", "Năng động",
      "Barber Foundation 2024",
      "Mỗi ngày đều là cơ hội học điều mới."),

    makeBarber(53, 2, "Junior barber — doanh thu thấp, cần mentoring.", 3,
      "Cắt tóc cơ bản", "Cần cải thiện",
      "Basic Certificate",
      "Đang cố gắng phát triển kỹ năng."),

    makeBarber(54, 2, "Junior barber mới — chưa đủ 6 tháng thâm niên.", 1,
      "Cắt cơ bản, Gội đầu", "Thân thiện, chăm chỉ",
      "Barber Foundation 2025",
      "Mỗi khách là một bài học quý."),

    makeBarber(55, 2, "Junior barber mới nhất, vừa hoàn thành đào tạo cơ bản.", 0,
      "Cắt tóc cơ bản", "Nhiệt tình, ham học",
      "Barber Basic Training 2026",
      "Chặng đường nghìn dặm bắt đầu từ một bước."),

    // ════════════════════════════════════════════════════════════════════
    // BRANCH 3 — Bình Thạnh (idBarber 56 → 65)
    // ════════════════════════════════════════════════════════════════════
    makeBarber(56, 3, "Master barber 10 năm kinh nghiệm, chuyên classic và vintage style.", 10,
      "Classic Cut, Vintage, Scissor Over Comb", "Chuẩn mực, chi tiết",
      "Master Barber Award 2019, Vintage Hair Expert",
      "Nghề barber là nghề giữ gìn phong cách."),

    makeBarber(57, 3, "Senior barber chuyên tóc nữ cao cấp và dịch vụ spa tóc.", 6,
      "Tóc nữ cao cấp, Spa tóc, Phục hồi tóc", "Sang trọng, tỉ mỉ",
      "Luxury Hair Spa Certification 2022",
      "Chăm sóc tóc là chăm sóc bản thân."),

    makeBarber(58, 3, "Senior barber chuyên fade và tóc trẻ em, gia đình.", 5,
      "Family Cut, Kids Hair, Fade", "Vui vẻ, kiên nhẫn",
      "Kids Hair Specialist, Family Barber Certificate",
      "Cắt tóc cho cả gia đình là niềm vui lớn nhất."),

    makeBarber(59, 3, "Junior barber chuyên tóc thể thao và pompadour.", 3,
      "Sport Cut, Pompadour, Quiff", "Năng động, hiện đại",
      "Sports Style Barber Workshop",
      "Tóc đẹp cho phong cách thể thao."),

    makeBarber(60, 3, "Junior barber thân thiện, chuyên gội đầu thư giãn.", 2,
      "Gội đầu, Cắt cơ bản, Massage da đầu", "Thư giãn, nhẹ nhàng",
      "Scalp Care & Relaxation Course",
      "Đôi tay khéo léo mang lại sự thư giãn."),

    makeBarber(61, 3, "Junior barber đam mê kỹ thuật đường thẳng và razor cut.", 2,
      "Razor Cut, Line Up, Edge Up", "Sắc sảo, chính xác",
      "Razor Artistry Workshop 2024",
      "Đường thẳng hoàn hảo là chữ ký của barber giỏi."),

    makeBarber(62, 3, "Junior barber chuyên nhuộm màu sáng tạo.", 2,
      "Fantasy Color, Ombre, Balayage cơ bản", "Sáng tạo, nghệ thuật",
      "Color Art Workshop 2024",
      "Màu sắc phản ánh cá tính."),

    makeBarber(63, 3, "Junior barber — doanh thu thấp, đang được hỗ trợ kỹ năng.", 3,
      "Cắt tóc cơ bản", "Đang phát triển",
      "Basic Barber Certificate",
      "Kiên trì là chìa khóa thành công."),

    makeBarber(64, 3, "Junior barber mới — chưa đủ 6 tháng thâm niên.", 1,
      "Cắt tóc cơ bản, Gội đầu", "Chăm chỉ, cẩn thận",
      "Barber Foundation 2025",
      "Học từ những điều nhỏ nhất."),

    makeBarber(65, 3, "Junior barber mới nhất, vừa gia nhập đội ngũ.", 0,
      "Cắt tóc cơ bản", "Năng động, nhiệt tình",
      "Đang đào tạo",
      "Hành trình barber của tôi bắt đầu từ đây."),

    // ════════════════════════════════════════════════════════════════════
    // BRANCH 4 — Thủ Đức (idBarber 66 → 75)
    // Chi nhánh đang Inactive → barber vẫn tồn tại, có data 2025
    // ════════════════════════════════════════════════════════════════════
    makeBarber(66, 4, "Senior barber trưởng nhóm chi nhánh Thủ Đức.", 7,
      "Full Service, Fade, Styling", "Chuyên nghiệp, quyết đoán",
      "Senior Barber Certificate 2021, Branch Leader Training",
      "Dẫn dắt đội nhóm bằng kỹ năng và tâm huyết."),

    makeBarber(67, 4, "Junior barber chuyên tóc nam trẻ trung.", 3,
      "Modern Cut, Fade, Styling", "Trẻ trung, sáng tạo",
      "Modern Barber Workshop 2023",
      "Phong cách trẻ bắt đầu từ kiểu tóc đúng."),

    makeBarber(68, 4, "Junior barber chuyên nhuộm và phục hồi tóc.", 3,
      "Nhuộm, Phục hồi, Ủ tóc", "Nhẹ nhàng, tỉ mỉ",
      "Color & Treatment Course 2023",
      "Tóc khỏe là nền tảng của tóc đẹp."),

    makeBarber(69, 4, "Junior barber thành thạo cắt tóc cơ bản và fade.", 2,
      "Fade, Taper, Cắt cơ bản", "Thân thiện, nhanh nhẹn",
      "Barber Foundation 2024",
      "Tốc độ và chất lượng phải song hành."),

    makeBarber(70, 4, "Junior barber chuyên dịch vụ khách gia đình.", 2,
      "Family Cut, Kids, Cắt nhanh", "Vui vẻ, kiên nhẫn",
      "Family Barber Certificate",
      "Phục vụ cả nhà là niềm hạnh phúc."),

    makeBarber(71, 4, "Junior barber chuyên tạo kiểu và sáp tóc.", 2,
      "Styling, Wax, Pomade, Texture", "Năng động, trendy",
      "Styling Arts Workshop 2024",
      "Kiểu tóc đẹp giúp bạn tự tin cả ngày."),

    makeBarber(72, 4, "Junior barber đam mê razor và beard art.", 2,
      "Razor, Beard, Line Up", "Chính xác, nghệ thuật",
      "Razor & Beard Artistry",
      "Sự chính xác là nghệ thuật."),

    makeBarber(73, 4, "Junior barber — doanh thu thấp, cần hỗ trợ thêm.", 3,
      "Cắt tóc cơ bản", "Đang phát triển",
      "Basic Certificate",
      "Luôn nỗ lực cải thiện bản thân."),

    makeBarber(74, 4, "Junior barber mới — chưa đủ 6 tháng thâm niên.", 1,
      "Cắt cơ bản, Gội đầu", "Chăm chỉ",
      "Barber Foundation 2025",
      "Bắt đầu từ những điều cơ bản."),

    makeBarber(75, 4, "Junior barber mới nhất chi nhánh Thủ Đức.", 0,
      "Cắt tóc cơ bản", "Nhiệt tình",
      "Đang đào tạo",
      "Đây là bước đầu tiên của hành trình dài."),

  ], { ignoreDuplicates: true });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("barbers", null, {});
}
"use strict";

export async function up(queryInterface) {
  await queryInterface.bulkInsert("news", [
    {
      title: "Xu hướng tóc nam hot nhất 2025: Buzz Cut trở lại mạnh mẽ",
      slug: "xu-huong-toc-nam-hot-nhat-2025",
      thumbnail: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
      summary: "Buzz Cut không chỉ là kiểu tóc quân đội nữa — giới trẻ Việt đang cải biến theo hướng cá tính và hiện đại hơn.",
      content: "Trong năm 2025, Buzz Cut nổi lên như một biểu tượng của sự tối giản mạnh mẽ. Các barber hàng đầu tại Việt Nam đang kết hợp fade technique với các đường cạo sắc bén để tạo ra những phiên bản hiện đại của kiểu tóc cổ điển này.\n\nĐiểm đặc biệt là sự kết hợp giữa Buzz Cut và beard styling — tạo nên tổng thể nam tính, cuốn hút mà không kém phần tinh tế.",
      category: "STYLE",
      status: "PUBLISHED",
      createdAt: new Date("2025-04-15"),
      updatedAt: new Date("2025-04-15"),
    },
    {
      title: "NOULE Barber khai trương chi nhánh mới tại Quận 7",
      slug: "noule-khai-truong-chi-nhanh-quan-7",
      thumbnail: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80",
      summary: "Chính thức mở cửa từ 01/05/2025, chi nhánh Quận 7 mang đến không gian sang trọng và đẳng cấp hơn.",
      content: "Sau nhiều tháng chuẩn bị, NOULE Barbershop chính thức khai trương chi nhánh thứ 4 tại Quận 7, TP.HCM. Không gian được thiết kế theo phong cách industrial-luxury với diện tích hơn 200m².\n\nChi nhánh mới sở hữu 8 ghế cắt cao cấp, khu vực chờ thoải mái và đội ngũ 6 barber lành nghề.",
      category: "NEWS",
      status: "PUBLISHED",
      createdAt: new Date("2025-05-01"),
      updatedAt: new Date("2025-05-01"),
    },
    {
      title: "Khuyến mãi tháng 5: Giảm 30% tất cả dịch vụ cắt tóc",
      slug: "khuyen-mai-thang-5-giam-30",
      thumbnail: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
      summary: "Đặt lịch ngay hôm nay để nhận ưu đãi đặc biệt — áp dụng toàn bộ chi nhánh NOULE trong tháng 5.",
      content: "Nhân dịp tháng 5, NOULE Barbershop triển khai chương trình ưu đãi lớn nhất trong năm:\n\n• Giảm 30% tất cả dịch vụ cắt tóc\n• Miễn phí dịch vụ gội đầu massage khi cắt tóc\n• Tặng voucher 50k cho lần sử dụng tiếp theo\n\nChương trình áp dụng từ 01/05 đến 31/05/2025.",
      category: "PROMOTION",
      status: "PUBLISHED",
      createdAt: new Date("2025-05-01"),
      updatedAt: new Date("2025-05-01"),
    },
    {
      title: "Cách chăm sóc tóc sau khi uốn sóng để giữ form lâu hơn",
      slug: "cham-soc-toc-sau-khi-uon-song",
      thumbnail: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80",
      summary: "Tóc uốn sóng cần được chăm sóc đúng cách để giữ được độ bóng và form sóng bền đẹp theo thời gian.",
      content: "Uốn sóng là một trong những dịch vụ được yêu thích nhất tại NOULE, nhưng nhiều khách hàng chưa biết cách chăm sóc đúng cách sau khi uốn.\n\nBí quyết từ team barber NOULE:\n\n1. Không gội đầu trong 48 giờ đầu\n2. Sử dụng dầu xả dưỡng tóc chuyên cho tóc uốn\n3. Hạn chế dùng máy sấy nhiệt cao\n4. Dùng lược răng thưa thay vì lược dày",
      category: "STYLE",
      status: "DRAFT",
      createdAt: new Date("2025-04-20"),
      updatedAt: new Date("2025-04-20"),
    },
    {
      title: "Beard Styling: Nghệ thuật tạo hình râu chuẩn barber",
      slug: "beard-styling-nghe-thuat-tao-hinh-rau",
      thumbnail: "https://images.unsplash.com/photo-1582893561942-d61bfb62f5ad?w=800&q=80",
      summary: "Từ fade beard đến full beard — mỗi kiểu râu đều cần kỹ thuật tỉa và tạo hình riêng để phù hợp khuôn mặt.",
      content: "Beard styling là một nghệ thuật đòi hỏi sự tỉ mỉ và am hiểu về khuôn mặt của từng người. Tại NOULE, mỗi barber đều được đào tạo chuyên sâu về kỹ thuật này.\n\nCác kiểu râu phổ biến nhất:\n• Classic Full Beard\n• Stubble Beard\n• Goatee\n• Fade Beard kết hợp cạo viền sắc nét",
      category: "STYLE",
      status: "PUBLISHED",
      createdAt: new Date("2025-04-10"),
      updatedAt: new Date("2025-04-10"),
    },
    {
      title: "NOULE tham dự Vietnam Barber Championship 2025",
      slug: "noule-vietnam-barber-championship-2025",
      thumbnail: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&q=80",
      summary: "Đội ngũ thợ cạo NOULE sẽ góp mặt tại giải vô địch barber toàn quốc, tranh tài cùng hàng trăm tài năng.",
      content: "Tháng 6/2025, đội tuyển NOULE gồm 3 barber xuất sắc nhất sẽ đại diện tham dự Vietnam Barber Championship 2025 tại Hà Nội.\n\nĐây là giải đấu uy tín nhất trong ngành barber Việt Nam với hơn 500 thí sinh từ khắp cả nước. NOULE đặt mục tiêu lọt vào Top 3 hạng mục Men's Classic Cut.",
      category: "NEWS",
      status: "PUBLISHED",
      createdAt: new Date("2025-03-28"),
      updatedAt: new Date("2025-03-28"),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("news", null, {});
}
"use strict";

// ════════════════════════════════════════════════════════════════════════════
// FILE 17 — reel_comments
// 19 reels, mỗi reel 3-7 comments
// Barber: 36-50, Customer: 2-31
// ════════════════════════════════════════════════════════════════════════════

// Seeded RNG for deterministic data
function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

const CUSTOMERS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
const BARBERS   = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];

const KH_CONTENTS = [
  "Video hay quá! Kỹ thuật cắt tóc chuyên nghiệp, mong được trải nghiệm.",
  "Cắt đẹp quá! Mình muốn đặt lịch cắt kiểu này có được không?",
  "Barber làm việc rất chuyên nghiệp, mình sẽ ghé ủng hộ.",
  "Nhìn kỹ thuật cắt mà thích quá, bao giờ mới được như vậy?",
  "Tay nghề barber cứng thật, nét cắt nào cũng chuẩn.",
  "Cho mình hỏi cắt kiểu này giá bao nhiêu và mất bao lâu vậy?",
  "Quá đỉnh! Mình sẽ giới thiệu bạn bè đến ủng hộ.",
  "Cắt tỉa tỉ mỉ quá, chắc chắn phải ghé một lần.",
  "Nhìn thao tác barber mà mê, đúng chuẩn dân chuyên nghiệp.",
  "Chất lượng quá! NOULE luôn là lựa chọn số một của mình.",
  "Cắt tóc ở đây mê lắm, đã thử nhiều chỗ rồi mà NOULE là nhất.",
  "Kỹ thuật fade và blend màu mượt quá, mình rất thích.",
  "Từ ngày cắt ở NOULE tóc mình đẹp hơn hẳn, cảm ơn team.",
  "Đẳng cấp! Các barber đều rất nhiệt tình và chuyên nghiệp.",
  "Sẽ quay lại thường xuyên, dịch vụ ở đây quá tuyệt vời.",
  "Mình đã thử nhiều tiệm nhưng NOULE là chuẩn nhất!",
  "Phong cách cắt rất hiện đại và hợp xu hướng.",
  "Barber tư vấn rất nhiệt tình, mình rất hài lòng.",
  "Không gian shop đẹp, nhân viên thân thiện, sẽ ghé lại.",
  "Cảm ơn barber đã tư vấn kiểu tóc phù hợp với khuôn mặt mình.",
];

const BARBER_REPLIES = [
  "Cảm ơn bạn! Ghé shop để được trải nghiệm dịch vụ tốt nhất nhé.",
  "Dạ được bạn, bạn có thể đặt lịch qua web hoặc ghé trực tiếp shop.",
  "Cảm ơn bạn đã ủng hộ! Shop luôn chào đón bạn.",
  "Chăm chỉ luyện tập mỗi ngày để phục vụ khách tốt hơn ạ!",
  "Cảm ơn bạn! Đó là nhờ sự tin tưởng của khách hàng đó ạ.",
  "Khoảng 150-200k tùy kiểu, thời gian tầm 45-60 phút bạn nha.",
  "Cảm ơn bạn nhiều! Chúng mình sẽ cố gắng hơn nữa.",
  "Tỉ mỉ từng đường kéo để khách hài lòng nhất có thể.",
  "Cảm ơn bạn! Đam mê là động lực lớn nhất của tụi mình.",
  "Cảm ơn bạn đã tin tưởng NOULE trong suốt thời gian qua!",
  "Quá cảm ơn bạn! Chúng mình luôn nỗ lực mỗi ngày.",
  "Fade và blend là thế mạnh của shop, cảm ơn bạn đã khen!",
  "Cảm ơn bạn! Thấy khách hài lòng là vui nhất rồi.",
  "Cảm ơn bạn! Đội ngũ barber sẽ tiếp tục cố gắng.",
  "Tuyệt vời! Hân hạnh được phục vụ bạn lần sau.",
  "Rất cảm ơn sự ủng hộ của bạn dành cho NOULE!",
  "Bạn cứ ghé bất cứ lúc nào, tụi mình sẵn sàng phục vụ.",
  "Cảm ơn bạn! Chúng mình luôn cập nhật xu hướng mới nhất.",
  "Niềm vui của tụi mình là thấy khách hài lòng khi ra về.",
  "Hẹn gặp lại bạn ở NOULE nhé!",
];

export async function up(queryInterface) {
  await queryInterface.bulkDelete("reel_comments", null, {});

  const comments = [];
  let commentId = 1;

  for (let idReel = 1; idReel <= 19; idReel++) {
    const rng = seededRandom(idReel * 7777);
    // Số comments cho reel này: 3-7
    const numComments = 3 + Math.floor(rng() * 5);
    // Barber của reel này (dựa trên file 15)
    const barberId = [36, 37, 38, 39, 36, 36, 37, 38, 39, 36, 37, 38, 39, 36, 37, 38, 39, 36, 37][idReel - 1];

    for (let c = 0; c < numComments; c++) {
      const isReply = c > 0 && rng() > 0.4; // ~60% comments có reply
      const khContent = KH_CONTENTS[Math.floor(rng() * KH_CONTENTS.length)];
      const khId = CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)];

      // Top-level comment từ customer
      comments.push({
        idComment: commentId,
        idReel,
        idUser: khId,
        parentCommentId: null,
        content: khContent,
        createdAt: new Date("2026-07-01"),
        updatedAt: new Date("2026-07-01"),
      });
      commentId++;

      // Reply từ barber (nếu có)
      if (isReply) {
        const barberReply = BARBER_REPLIES[Math.floor(rng() * BARBER_REPLIES.length)];
        comments.push({
          idComment: commentId,
          idReel,
          idUser: barberId,
          parentCommentId: commentId - 1,
          content: barberReply,
          createdAt: new Date("2026-07-01"),
          updatedAt: new Date("2026-07-01"),
        });
        commentId++;
      }
    }
  }

  await queryInterface.bulkInsert("reel_comments", comments);
  console.log(`✅ [17] Inserted ${comments.length} reel_comments`);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("reel_comments", null, {});
}
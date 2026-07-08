// seeders/hair-analyses-seeder.js
"use strict";

export async function up(queryInterface) {
  const now = new Date();

  await queryInterface.bulkInsert("hair_analyses", [
    // ── Khách thân thiết (idCustomer 2-11) ─────────────────────────────────

    { customerId: 3,  faceShape: "Ovale",   skinToneUndertone: "neutral", skinType: "oily",   selectedHairstyleName: "Pompadour",       lastAnalysisAt: new Date("2026-03-15"), rating: 5, feedback: "AI phân tích chính xác, rất hài lòng.",          createdAt: new Date("2026-03-15"), updatedAt: new Date("2026-03-15") },
    { customerId: 4,  faceShape: "Ovale",   skinToneUndertone: "cool",   skinType: "dry",    selectedHairstyleName: "Slick Back",      lastAnalysisAt: new Date("2026-04-01"), rating: 4, feedback: "Khá phù hợp với khuôn mặt mình.",               createdAt: new Date("2026-04-01"), updatedAt: new Date("2026-04-01") },
    { customerId: 5,  faceShape: "Ovale",   skinToneUndertone: "warm",   skinType: "normal", selectedHairstyleName: "Textured Crop",   lastAnalysisAt: new Date("2026-04-10"), rating: 4, feedback: null,                                            createdAt: new Date("2026-04-10"), updatedAt: new Date("2026-04-10") },
    { customerId: 6,  faceShape: "Ovale",   skinToneUndertone: "neutral", skinType: "normal", selectedHairstyleName: "French Crop",    lastAnalysisAt: new Date("2026-04-20"), rating: 5, feedback: "Tuyệt vời, mình sẽ giới thiệu bạn bè!",         createdAt: new Date("2026-04-20"), updatedAt: new Date("2026-04-20") },

    // Mặt Tròn — AI gợi ý trung bình → rating 3-4
    { customerId: 7,  faceShape: "Tròn",   skinToneUndertone: "warm",   skinType: "oily",   selectedHairstyleName: "Side Part",       lastAnalysisAt: new Date("2026-03-20"), rating: 3, feedback: "Gợi ý tạm ổn nhưng chưa thực sự phù hợp lắm.", createdAt: new Date("2026-03-20"), updatedAt: new Date("2026-03-20") },
    { customerId: 8,  faceShape: "Tròn",   skinToneUndertone: "cool",   skinType: "normal", selectedHairstyleName: "Quiff",           lastAnalysisAt: new Date("2026-04-05"), rating: 4, feedback: "Ổn, nhưng mình phải nhờ thợ chỉnh thêm.",       createdAt: new Date("2026-04-05"), updatedAt: new Date("2026-04-05") },
    { customerId: 9,  faceShape: "Tròn",   skinToneUndertone: "neutral", skinType: "dry",   selectedHairstyleName: "Ivy League",      lastAnalysisAt: new Date("2026-02-28"), rating: 3, feedback: "Kiểu tóc được gợi ý chưa thực sự tôn khuôn mặt.", createdAt: new Date("2026-02-28"), updatedAt: new Date("2026-02-28") },
    { customerId: 10, faceShape: "Tròn",   skinToneUndertone: "warm",   skinType: "oily",   selectedHairstyleName: "Buzz Cut",        lastAnalysisAt: new Date("2026-03-25"), rating: 3, feedback: "Cần thêm nhiều mẫu tóc hơn cho mặt tròn.",      createdAt: new Date("2026-03-25"), updatedAt: new Date("2026-03-25") },
    { customerId: 11, faceShape: "Tròn",   skinToneUndertone: "cool",   skinType: "normal", selectedHairstyleName: "Crew Cut",        lastAnalysisAt: new Date("2026-04-15"), rating: 4, feedback: null,                                            createdAt: new Date("2026-04-15"), updatedAt: new Date("2026-04-15") },

    

    // ── Khách mới (idCustomer 21-31) ───────────────────────────────────────
    { customerId: 21, faceShape: "Ovale",   skinToneUndertone: "warm",   skinType: "normal", selectedHairstyleName: "French Crop",     lastAnalysisAt: new Date("2026-04-15"), rating: 5, feedback: "Ứng dụng hay quá, gợi ý rất chuẩn!",           createdAt: new Date("2026-04-15"), updatedAt: new Date("2026-04-15") },
    { customerId: 22, faceShape: "Tròn",   skinToneUndertone: "cool",   skinType: "oily",   selectedHairstyleName: "Ivy League",      lastAnalysisAt: new Date("2026-04-20"), rating: 3, feedback: "Giao diện đẹp nhưng gợi ý chưa sát.",          createdAt: new Date("2026-04-20"), updatedAt: new Date("2026-04-20") },
    { customerId: 23, faceShape: "Vuông",  skinToneUndertone: "neutral", skinType: "dry",   selectedHairstyleName: "Side Part",       lastAnalysisAt: new Date("2026-03-28"), rating: 2, feedback: "Mặt vuông mà gợi ý Side Part thì không hợp.",   createdAt: new Date("2026-03-28"), updatedAt: new Date("2026-03-28") },
    { customerId: 24, faceShape: "Ovale",   skinToneUndertone: "warm",   skinType: "normal", selectedHairstyleName: "Undercut",        lastAnalysisAt: new Date("2026-05-01"), rating: 4, feedback: null,                                            createdAt: new Date("2026-05-01"), updatedAt: new Date("2026-05-01") },
    { customerId: 25, faceShape: "Tròn",   skinToneUndertone: "cool",   skinType: "oily",   selectedHairstyleName: "Textured Crop",   lastAnalysisAt: new Date("2026-04-28"), rating: 4, feedback: "Ổn, mình thấy phù hợp.",                       createdAt: new Date("2026-04-28"), updatedAt: new Date("2026-04-28") },
    { customerId: 26, faceShape: "Vuông",  skinToneUndertone: "warm",   skinType: "normal", selectedHairstyleName: "Pompadour",       lastAnalysisAt: new Date("2026-05-03"), rating: 3, feedback: "Cần thêm dữ liệu mặt vuông hơn.",              createdAt: new Date("2026-05-03"), updatedAt: new Date("2026-05-03") },
    { customerId: 27, faceShape: "Ovale",   skinToneUndertone: "neutral", skinType: "dry",   selectedHairstyleName: "Slick Back",      lastAnalysisAt: new Date("2026-04-10"), rating: 5, feedback: "Mình đặt lịch ngay sau khi xem gợi ý!",        createdAt: new Date("2026-04-10"), updatedAt: new Date("2026-04-10") },
    { customerId: 28, faceShape: "Tròn",   skinToneUndertone: "warm",   skinType: "oily",   selectedHairstyleName: "Crew Cut",        lastAnalysisAt: new Date("2026-03-03"), rating: 3, feedback: null,                                            createdAt: new Date("2026-03-03"), updatedAt: new Date("2026-03-03") },
    { customerId: 29, faceShape: "Ovale",   skinToneUndertone: "cool",   skinType: "normal", selectedHairstyleName: "Pompadour",       lastAnalysisAt: new Date("2026-02-18"), rating: 4, feedback: "Gợi ý tốt, mình hài lòng.",                    createdAt: new Date("2026-02-18"), updatedAt: new Date("2026-02-18") },
    { customerId: 30, faceShape: "Vuông",  skinToneUndertone: "neutral", skinType: "dry",   selectedHairstyleName: "Buzz Cut",        lastAnalysisAt: new Date("2026-01-08"), rating: 2, feedback: "Không hợp với mặt vuông, cần cải thiện.",      createdAt: new Date("2026-01-08"), updatedAt: new Date("2026-01-08") },
    { customerId: 31, faceShape: "Tròn",   skinToneUndertone: "warm",   skinType: "oily",   selectedHairstyleName: "Quiff",           lastAnalysisAt: new Date("2026-05-07"), rating: 4, feedback: "Khá ổn, mình thích giao diện phân tích.",      createdAt: new Date("2026-05-07"), updatedAt: new Date("2026-05-07") },
  ], { ignoreDuplicates: true });
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete("hair_analyses", null, {});
}
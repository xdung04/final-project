

import { createEmbedding, deleteNamespace } from "../services/pineconeService.js";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

// Đọc dữ liệu từ các file JSON
import hairstyles from "../data/hairstyles.json" with { type: "json" };
import colors     from "../data/colors.json"      with { type: "json" };
import haircare   from "../data/hair_care.json"    with { type: "json" };
import products   from "../data/product.json"    with { type: "json" };

const pc    = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("project", "project-yfyk5m4.svc.aped-4627-b74a.pinecone.io");

const BATCH_SIZE = 5;

/**
 * Hàm xử lý cuốn chiếu (Batching) từ gốc:
 * Cắt nhỏ mảng -> Tạo text -> Tạo Embedding đợt đó -> Đẩy lên Pinecone đợt đó luôn
 */
async function processAndUpsertBatch(namespace, rawData, parseItemFn) {
  console.log(`\n🚀 Đang xử lý namespace [${namespace}] với ${rawData.length} bản ghi...`);
  
  for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
    // 1. Cắt ra một nhóm nhỏ (tối đa 5 phần tử)
    const batchRaw = rawData.slice(i, i + BATCH_SIZE);
    
    // 2. Chỉ tạo embedding cho đúng nhóm nhỏ này (An toàn cho RAM/CPU)
    const batchRecords = await Promise.all(
      batchRaw.map(async (item) => {
        // Gọi hàm callback để dựng chuỗi text tương ứng với từng loại data
        const parsed = parseItemFn(item); 
        
        return {
          id: item.id.toString(),
          values: await createEmbedding(parsed.text),
          metadata: {
            text: parsed.text,
            ...parsed.metadata, // Gộp các trường metadata đặc thù của từng bảng
          },
        };
      })
    );

    // 3. Đẩy luôn nhóm nhỏ này lên Pinecone
    await index.namespace(namespace).upsert(batchRecords);
    console.log(`   ✅ Đã nạp đợt: ${Math.min(i + BATCH_SIZE, rawData.length)}/${rawData.length}`);
  }
}

// ─── MAIN PIPELINE ─────────────────────────────────────────────
async function main() {
  // Đã đồng bộ tên namespace "haircare" viết liền theo đúng file JSON của bạn
  const namespaces = ["hairstyles", "colors", "haircare", "products"];

  console.log("🗑️  Xóa các namespace cũ trên Pinecone...");
  for (const ns of namespaces) {
    await deleteNamespace(ns);
  }

  // 1. NẠP HAIRSTYLES
  await processAndUpsertBatch("hairstyles", hairstyles, (h) => {
    const text = `
Kiểu tóc: ${h.name}.
Mô tả: ${h.description}.
Chất tóc hợp: ${h.suitable_hair.join(", ")}.
Chất tóc không hợp: ${h.unsuitable_hair.join(", ")}.
Khuôn mặt hợp: ${h.suitable_face.join(", ")}.
Khuôn mặt không hợp: ${h.unsuitable_face.join(", ")}.
Che khuyết điểm: ${h.flaw_coverage.join(", ")}.
Phong cách: ${h.style}.
Môi trường: ${h.environment}.
Độ tuổi: ${h.age_range}.
Bảo dưỡng: ${h.maintenance}.
Thời gian cắt lại: ${h.recut_time}.
Dấu hiệu cần cắt lại: ${h.recut_signs}.
Bí kíp thợ: ${h.barber_tips}.
    `.trim();

    return {
      text,
      metadata: {
        id: h.id,
        name: h.name,
        suitable_face: h.suitable_face.join(", "),
        unsuitable_face: h.unsuitable_face.join(", "),
        suitable_hair: h.suitable_hair.join(", "),
        style: h.style,
        maintenance: h.maintenance,
        recut_time: h.recut_time,
      }
    };
  });

  // 2. NẠP COLORS
  await processAndUpsertBatch("colors", colors, (c) => {
    const text = `
Màu tóc: ${c.name}.
Mô tả: ${c.description}.
Tông da hợp: ${c.suitable_skin_tones.join(", ")}.
Tông da không hợp: ${c.unsuitable_skin_tones.join(", ")}.
Cần tẩy: ${c.bleach_required}.
Độ hư tóc: ${c.damage_level}/5.
Độ bền màu: ${c.color_durability}.
Mùa phù hợp: ${c.suitable_seasons.join(", ")}.
Kiểu tóc hợp: ${c.suitable_hairstyles.join(", ")}.
Bí kíp thợ: ${c.barber_tips}.
    `.trim();

    return {
      text,
      metadata: {
        id: c.id,
        name: c.name,
        suitable_skin_tones: c.suitable_skin_tones.join(", "),
        bleach_required: c.bleach_required,
        damage_level: c.damage_level,
        color_durability: c.color_durability,
      }
    };
  });

  // 3. NẠP HAIRCARE
  await processAndUpsertBatch("haircare", haircare, (h) => {
    const text = `
Tình trạng tóc: ${h.condition}.
Triệu chứng: ${h.symptoms}.
Nguyên nhân: ${h.causes.join("; ")}.
Xử lý tại nhà: ${h.home_treatment}.
Nên làm: ${h.dos_and_donts.should.join("; ")}.
Không nên: ${h.dos_and_donts.should_not.join("; ")}.
Khi nào ra tiệm: ${h.when_to_salon}.
Khi nào gặp bác sĩ: ${h.when_to_doctor}.
    `.trim();

    return {
      text,
      metadata: {
        id: h.id,
        condition: h.condition,
        symptoms: h.symptoms,
        when_to_salon: h.when_to_salon,
        when_to_doctor: h.when_to_doctor,
      }
    };
  });

  // 4. NẠP PRODUCTS
  await processAndUpsertBatch("products", products, (p) => {
    const text = `
Sản phẩm: ${p.product_name}.
Độ giữ nếp: ${p.hold_level}/5.
Độ bóng: ${p.shine_level}.
Chất tóc hợp: ${p.suitable_hair.join(", ")}.
Chất tóc không hợp: ${p.unsuitable_hair.join(", ")}.
Kiểu tóc hợp: ${p.suitable_hairstyles.join(", ")}.
Cách dùng: ${p.usage_guide}.
Ưu điểm: ${p.pros.join("; ")}.
Nhược điểm: ${p.cons.join("; ")}.
Gội ra: ${p.washability}.
    `.trim();

    return {
      text,
      metadata: {
        id: p.id,
        name: p.product_name,
        hold_level: p.hold_level,
        shine_level: p.shine_level,
        washability: p.washability,
        suitable_hairstyles: p.suitable_hairstyles.join(", "),
      }
    };
  });

  console.log("\n🎉 [HOÀN THÀNH] Tất cả dữ liệu tri thức đã được tối ưu hóa cuốn chiếu lên Pinecone mượt mà!");
}

main().catch(console.error);
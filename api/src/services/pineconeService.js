import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";

// ✅ Lazy init — tránh lỗi ES Module hoist
let _index = null;
function getPineconeIndex() {
  if (!_index) {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    _index = pc.index("project", "project-yfyk5m4.svc.aped-4627-b74a.pinecone.io");
  }
  return _index;
}

let embedder = null;
async function getEmbedder() {
  if (!embedder) {
    console.log("⏳ Loading embedding model...");
    embedder = await pipeline("feature-extraction", "Xenova/multilingual-e5-large");
    console.log("✅ Embedding model ready");
  }
  return embedder;
}

export async function createEmbedding(text) {
  const embed = await getEmbedder();
  const output = await embed(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
export async function upsertBarbers(barbers) {
  try {
    const index = getPineconeIndex();

    // Đảm bảo model load xong 1 lần duy nhất trước khi bắt đầu
    await getEmbedder();

    const BATCH_SIZE = 5; // xử lý 5 barber mỗi lần, tránh OOM
    const allRecords = [];

    for (let i = 0; i < barbers.length; i += BATCH_SIZE) {
      const batch = barbers.slice(i, i + BATCH_SIZE);

      const records = await Promise.all(
        batch.map(async (b) => {
          const text = `
            Tên barber: ${b.fullName}.
            Chi nhánh: ${b.branchName}.
            Mô tả: ${b.profileDescription}.
            Kinh nghiệm: ${b.experienceYears} năm.
            Chuyên môn: ${b.specialty}.
            Phong cách: ${b.style}.
            Chứng chỉ: ${b.certificates}.
            Triết lý: ${b.philosophy}.
            Đánh giá trung bình: ${b.avgRate}.
          `.trim();

return {
  id: b.idBarber.toString(),
  values: await createEmbedding(text),
  metadata: {
    text,

    idBarber: b.idBarber,
    idBranch: b.idBranch,
    fullName: b.fullName,
    branchName: b.branchName,
    profileDescription: b.profileDescription,
    experienceYears: b.experienceYears,
    specialty: b.specialty,
    style: b.style,
    certificates: b.certificates,
    philosophy: b.philosophy,
    avgRate: b.avgRate,
  },
};
        })
      );

      allRecords.push(...records);
      console.log(`✅ Embedded batch ${Math.floor(i / BATCH_SIZE) + 1} (${allRecords.length}/${barbers.length})`);
    }

    await index.namespace("barbers").upsert(allRecords);
    console.log(`✅ Upserted ${allRecords.length} barbers`);
  } catch (error) {
    console.error("Upsert Barber Error:", error);
    throw new Error("Không thể upsert barbers vào Pinecone");
  }
}

export async function upsertBranches(branches) {
  try {
    const index = getPineconeIndex(); // ← gọi ở đây
    const records = await Promise.all(
      branches.map(async (b) => {
        const isActive = ["active", "true", "1", "đang hoạt động"].includes(
          (b.status || "").trim().toLowerCase()
        );

        const text = `
          Chi nhánh: ${b.name || "Chưa có tên"}.
          Địa chỉ: ${b.address || "Không có địa chỉ"}.
          Trạng thái: ${isActive ? "Đang hoạt động" : "Ngừng hoạt động"}.
          Giờ mở cửa: ${b.openTime || "N/A"}.
          Giờ đóng cửa: ${b.closeTime || "N/A"}.
        `.trim();

        return {
          id: b.idBranch.toString(),
          values: await createEmbedding(text),
      metadata: {
        text,

        idBranch: b.idBranch,
        name: b.name,
        address: b.address,
        isActive,
        openTime: b.openTime,
        closeTime: b.closeTime,
      }
        };
      })
    );

    await index.namespace("branches").upsert(records);
    console.log(`✅ Upserted ${records.length} branches`);
  } catch (error) {
    console.error("Upsert Branch Error:", error);
    throw new Error("Không thể upsert branches vào Pinecone");
  }
}
export async function upsertServices(services) {
  try {
    const index = getPineconeIndex();

    await getEmbedder();

    const records = await Promise.all(
      services.map(async (s) => {
        const text = `
Tên dịch vụ: ${s.name}.
Mô tả: ${s.description || "Không có mô tả"}.
Giá: ${s.price} VNĐ.
Thời lượng: ${s.duration} phút.
`.trim();

        return {
          id: s.idService.toString(),
          values: await createEmbedding(text),
          metadata: {
            text,
            idService: s.idService,
            name: s.name,
            description: s.description,
            price: s.price,
            duration: s.duration,
          },
        };
      })
    );

    await index.namespace("services").upsert(records);

    console.log(`✅ Upserted ${records.length} services`);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
// pineconeService.js — thêm vào cuối
export async function deleteNamespace(namespace) {
  try {
    const index = getPineconeIndex();
    await index.namespace(namespace).deleteAll();
    console.log(`🗑️ Đã xóa namespace ${namespace}`);
  } catch (error) {
    if (error.message?.includes("404")) {
      console.log(`⚠️ Namespace ${namespace} chưa tồn tại, bỏ qua bước xóa`);
      return;
    }
    throw error;
  }
}
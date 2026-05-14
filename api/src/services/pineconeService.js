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
    const index = getPineconeIndex(); // ← gọi ở đây, dotenv đã load rồi
    const records = await Promise.all(
      barbers.map(async (b) => {
        const text = `
          Tên barber: ${b.fullName || "Chưa có tên"}.
          Chi nhánh: ${b.branchName || "Chưa có chi nhánh"}.
          Mô tả: ${b.profileDescription || "Không có mô tả"}.
          Đánh giá trung bình: ${b.avgRate ?? 0}.
        `.trim();

        return {
          id: b.idBarber.toString(),
          values: await createEmbedding(text),
          metadata: {
            text,
            metadata: JSON.stringify({
              idBarber: b.idBarber,
              idBranch: b.idBranch,
              fullName: b.fullName || "",
              branchName: b.branchName || "",
              profileDescription: b.profileDescription || "",
              avgRate: b.avgRate ?? 0,
            }),
          },
        };
      })
    );

    await index.namespace("barbers").upsert(records);
    console.log(`✅ Upserted ${records.length} barbers`);
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
          Dịch vụ: ${b.displayText || "Chưa có thông tin"}.
        `.trim();

        return {
          id: b.idBranch.toString(),
          values: await createEmbedding(text),
          metadata: {
            text,
            metadata: JSON.stringify({
              idBranch: b.idBranch,
              name: b.name || "",
              address: b.address || "",
              isActive,
              openTime: b.openTime || "",
              closeTime: b.closeTime || "",
            }),
          },
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
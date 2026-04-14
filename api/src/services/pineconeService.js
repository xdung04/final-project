import index from "../config/pinecone.js";
import fetch from "node-fetch";
const HF_API_KEY = process.env.HF_API_KEY;  
// Tạm thời test với embedding từ HF
export async function createEmbedding(text) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/intfloat/multilingual-e5-large",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text // đảm bảo model sẵn sàng
        }),
      }
    );

    const result = await response.json();

    // debug kết quả
    console.log("HF embedding result:", result);

    // xử lý đa dạng format trả về
    if (Array.isArray(result)) {
      if (Array.isArray(result[0])) {
        // chuẩn mảng 2 chiều [ [..embedding..] ]
        return result[0];
      } else {
        // một số trường hợp trả mảng 1 chiều
        return result;
      }
    } else if (result?.embedding) {
      // một số API có key "embedding"
      return result.embedding;
    } else {
      throw new Error("HF API returned unexpected format");
    }
  } catch (err) {
    console.error("⚠️ HF API failed:", err.message);
    // fallback tạm thời
    return Array(1024).fill(0.01);
  }
}

// Test upsert barbers bằng text, Pinecone tự sinh vector
export async function upsertBarbers(barbers) {
  try {
    const records = barbers.map((b) => ({
      id: b.idBarber.toString(),
      text: `
        Tên barber: ${b.fullName || "Chưa có tên"}.
        Chi nhánh: ${b.branchName || "Chưa có chi nhánh"}.
        Mô tả: ${b.profileDescription || "Không có mô tả"}.
        Đánh giá trung bình: ${b.avgRate ?? 0}.
      `.trim(),
      metadata: JSON.stringify({
        idBarber: b.idBarber,
        idBranch: b.idBranch,
        fullName: b.fullName || "",
        branchName: b.branchName || "",
        profileDescription: b.profileDescription || "",
        avgRate: b.avgRate ?? 0,
      }),
    }));

    console.log("📦 Records ready to upsert:", records.length);
    console.dir(records, { depth: null });

    // Đẩy dữ liệu vào Pinecone
    const namespaceIndex = index.namespace("barbers");
    await namespaceIndex.upsertRecords(records);

  } catch (error) {
    console.error("Upsert Barber Error:", error);
    throw new Error("Không thể upsert dữ liệu vào Pinecone");
  }
}
export async function upsertBranches(branches) {
  try {
    const records = branches.map((b) => {
      const statusRaw = (b.status || "").trim().toLowerCase();
      const isActive =
        statusRaw === "active" ||
        statusRaw === "true" ||
        statusRaw === "1" ||
        statusRaw === "đang hoạt động";

      return {
        id: b.idBranch.toString(),
        text: `
Chi nhánh: ${b.name || "Chưa có tên"}.
Địa chỉ: ${b.address || "Không có địa chỉ"}.
Trạng thái: ${isActive ? "Đang hoạt động" : "Ngừng hoạt động"}.
Giờ mở cửa: ${b.openTime || "N/A"}.
Giờ đóng cửa: ${b.closeTime || "N/A"}.
Dịch vụ: ${b.displayText || "Chưa có thông tin"}.
        `.trim(),
        metadata: JSON.stringify({
          idBranch: b.idBranch,
          name: b.name || "",
          address: b.address || "",
          isActive,
          openTime: b.openTime || "",
          closeTime: b.closeTime || "",
        }),
      };
    });

    const namespaceIndex = index.namespace("branches");
    await namespaceIndex.upsertRecords(records);


    console.log(`✅ Upserted ${records.length} branches into Pinecone (namespace: branches)`);
  } catch (error) {
    console.error("❌ Lỗi upsert Pinecone:", error);
    throw new Error("Không thể upsert dữ liệu chi nhánh vào Pinecone");
  }
}



// src/services/knowledgeTools.js
//
// ─────────────────────────────────────────────────────────────
// PHIÊN BẢN LANGCHAIN — thay đổi so với bản gốc:
//
//   - Toàn bộ logic Pinecone (format kết quả, filter branchName, fallback
//     bỏ filter khi không match, xử lý lỗi...) GIỮ NGUYÊN 100%. Đây là
//     phần xử lý dữ liệu thuần, không liên quan gì tới LangChain.
//
//   - Khác biệt duy nhất: thêm export `searchKnowledgeTool`, bọc hàm
//     `searchKnowledge` gốc (đổi tên nội bộ thành `_searchKnowledgeImpl`)
//     bằng `tool()` của LangChain + schema Zod. Trước đây schema
//     (name/description/parameters JSON) được định nghĩa TAY, RIÊNG BIỆT
//     bên trong bookingBrain.js — tách khỏi hàm thực thi thật. Với
//     LangChain, schema + hàm thực thi gộp làm MỘT, tránh lệch nhau khi
//     sửa (vd sửa tham số hàm mà quên sửa JSON schema mô tả cho model).
//
//   - `searchKnowledgeTool` là 1 StructuredTool chuẩn của LangChain, có
//     thể truyền thẳng vào `tools: [...]` khi tạo Agent (createReactAgent)
//     ở bookingBrain.js — Agent sẽ tự đọc `.name`, `.description`,
//     `.schema` để quyết định khi nào gọi, gọi với tham số gì.
// ─────────────────────────────────────────────────────────────

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createEmbedding } from "./pineconeService.js";
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("project", "project-yfyk5m4.svc.aped-4627-b74a.pinecone.io");

// ─────────────────────────────────────────────────────────────
// 2 nhóm namespace khác bản chất dữ liệu:
//   - "text namespaces" (hairstyles, colors, products, haircare): mỗi
//     record đã có sẵn field metadata.text soạn sẵn cho con người đọc.
//   - "structured namespaces" (barbers, branches): metadata là các field
//     rời (fullName, specialty, avgRate, address, openTime...), CHƯA có
//     field "text" nào cả — nếu dùng chung logic format cũ
//     (meta.text || meta.content || meta.description || "") thì sẽ trả
//     về chuỗi RỖNG cho 2 namespace mới này. Phải format riêng.
// ─────────────────────────────────────────────────────────────
const TEXT_NAMESPACES = ["hairstyles", "colors", "products", "haircare"];
const STRUCTURED_NAMESPACES = ["barbers", "branches", "services"];
const VALID_NAMESPACES = [...TEXT_NAMESPACES, ...STRUCTURED_NAMESPACES];

const TOP_K = 5;

function formatTextResult(meta) {
  return meta.text || meta.content || meta.description || "";
}
function formatServiceResult(meta) {
  const parts = [
    `Dịch vụ: ${meta.name || "Không rõ tên"}`,
    meta.description ? `Mô tả: ${meta.description}` : null,
    meta.price != null ? `Giá: ${Number(meta.price).toLocaleString("vi-VN")} VNĐ` : null,
    meta.duration != null ? `Thời lượng: ${meta.duration} phút` : null,
    meta.branchNames?.length
      ? `Có tại: ${meta.branchNames.join(", ")}`
      : null,
  ].filter(Boolean);

  return parts.join(". ");
}
function formatBarberResult(meta) {
  const parts = [
    `Thợ: ${meta.fullName || "Không rõ tên"}`,
    meta.branchName ? `Chi nhánh: ${meta.branchName}` : null,
    meta.specialty ? `Chuyên môn: ${meta.specialty}` : null,
    meta.style ? `Phong cách: ${meta.style}` : null,
    meta.experienceYears != null ? `Kinh nghiệm: ${meta.experienceYears} năm` : null,
    meta.avgRate != null ? `Đánh giá trung bình: ${meta.avgRate}/5` : null,
    meta.certificates ? `Chứng chỉ: ${meta.certificates}` : null,
    meta.philosophy ? `Triết lý: ${meta.philosophy}` : null,
    meta.profileDescription || null,
  ].filter(Boolean);
  return parts.join(". ");
}

function formatBranchResult(meta) {
  const parts = [
    `Chi nhánh: ${meta.name || "Không rõ tên"}`,
    meta.address ? `Địa chỉ: ${meta.address}` : null,
    meta.openTime && meta.closeTime ? `Giờ mở cửa: ${meta.openTime} - ${meta.closeTime}` : null,
    meta.isActive === false ? "Hiện đang tạm ngưng hoạt động" : null,
  ].filter(Boolean);
  return parts.join(". ");
}

function formatResult(namespace, meta) {
  if (namespace === "barbers")
    return formatBarberResult(meta);

  if (namespace === "branches")
    return formatBranchResult(meta);

  if (namespace === "services")
    return formatServiceResult(meta);

  return formatTextResult(meta);
}

// ─────────────────────────────────────────────────────────────
export async function debugIndexStats() {
  try {
    const stats = await index.describeIndexStats();
    console.log("=== PINECONE INDEX STATS ===");
    console.log(JSON.stringify(stats.namespaces, null, 2));
    return stats.namespaces;
  } catch (err) {
    console.error("[knowledgeTools] debugIndexStats error:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// _searchKnowledgeImpl — GIỮ NGUYÊN 100% logic gốc (chỉ đổi tên hàm để
// nội bộ dùng, còn export ra ngoài là bản bọc Tool bên dưới).
//
// LLM tự chọn namespace dựa vào nội dung câu hỏi. Với namespace
// "barbers"/"services", LLM có thể truyền thêm branchName để LỌC kết quả
// chỉ trong 1 chi nhánh — bắt buộc cần thiết vì semantic search trên
// "chuyên môn/phong cách" không tự động giới hạn theo chi nhánh (vd hỏi
// "quận 1 có ai cắt undercut đẹp" mà không lọc branchName sẽ trả về cả
// thợ chi nhánh khác miễn là chuyên môn khớp).
// ─────────────────────────────────────────────────────────────
async function _searchKnowledgeImpl({ query, namespace, branchName }) {
  if (!VALID_NAMESPACES.includes(namespace)) {
    return {
      success: false,
      error: `Namespace không hợp lệ. Chỉ chấp nhận: ${VALID_NAMESPACES.join(", ")}`,
    };
  }

  try {
    const vec = await createEmbedding(query);

    const baseOptions = { vector: vec, topK: TOP_K, includeMetadata: true };
    let appliedFilter = null;

    if (branchName) {
      if (namespace === "barbers") {
        appliedFilter = {
          branchName: {
            $eq: branchName,
          },
        };
      }

      if (namespace === "services") {
        appliedFilter = {
          branchNames: {
            $in: [branchName],
          },
        };
      }
    }
    console.log(`=== searchKnowledge: namespace="${namespace}" query="${query}" filter=${JSON.stringify(appliedFilter)} ===`);

    let res = await index.namespace(namespace).query(
      appliedFilter ? { ...baseOptions, filter: appliedFilter } : baseOptions
    );
    let matches = res.matches || [];
    let filterWasDroppedAsFallback = false;

    // ✅ Fallback: nếu lọc theo branchName mà không ra kết quả nào, có thể
    // do tên chi nhánh trong metadata Pinecone không khớp CHÍNH XÁC với
    // branchName truyền vào (khác cách viết/viết hoa/dấu). Thay vì trả về
    // rỗng ngay (buộc model phải tốn thêm 1 lượt gọi lại), tự động thử lại
    // KHÔNG filter ngay tại đây — rẻ hơn (không tốn token) và vẫn có cơ hội
    // trả được thông tin hữu ích, kèm cảnh báo để model biết kết quả này
    // CHƯA chắc đúng chi nhánh khách hỏi.
    if (appliedFilter && matches.length === 0) {
      console.log(`=== searchKnowledge: filter branchName="${branchName}" không ra kết quả, thử lại không filter ===`);
      res = await index.namespace(namespace).query(baseOptions);
      matches = res.matches || [];
      filterWasDroppedAsFallback = true;

      // Debug: in ra giá trị branchName THẬT của các record tìm được (khi
      // không filter) để so sánh trực tiếp với giá trị vừa dùng để filter
      // — cách nhanh nhất để phát hiện lệch chính tả/khoảng trắng/viết hoa
      // giữa branchName truyền vào và branchName lưu thật trong metadata.
      const actualBranchNames = [
        ...new Set(
          matches.flatMap((m) =>
            m.metadata?.branchNames ?? [m.metadata?.branchName]
          )
        ),
      ];
      console.log(`=== searchKnowledge: branchName THẬT trong metadata các match = ${JSON.stringify(actualBranchNames)} (so với filter đang dùng: "${branchName}") ===`);
    }

    console.log(`=== searchKnowledge: số match tìm được = ${matches.length} ===`);

    if (matches.length === 0) {
      let message = "Không tìm thấy thông tin phù hợp.";

      if (namespace === "barbers" && branchName) {
        message = `Không tìm thấy thợ phù hợp ở ${branchName}.`;
      }

      if (namespace === "services" && branchName) {
        message = `Không tìm thấy dịch vụ tại ${branchName}.`;
      }

      return {
        success: true,
        results: [],
        message,
      };
    }

    const results = matches.map((m) => ({
      score: m.score,
      content: formatResult(namespace, m.metadata || {}),
    }));
    const warning =
      namespace === "barbers"
        ? `Không tìm thấy thợ nào khớp chính xác chi nhánh "${branchName}"...`
        : namespace === "services"
          ? `Không tìm thấy dịch vụ nào khớp chính xác chi nhánh "${branchName}"...`
          : undefined;

    return {
      success: true,
      results,
      ...(filterWasDroppedAsFallback && warning && { warning }),
    };
  } catch (err) {
    console.error(`[knowledgeTools] searchKnowledge error:`, err.message);
    return { success: false, error: err.message };
  }
}

// Giữ nguyên tên export cũ `searchKnowledge` để không phải sửa những
// chỗ khác trong hệ thống còn đang gọi trực tiếp hàm này (nếu có), ví
// dụ script debug/test không đi qua Agent.
export const searchKnowledge = _searchKnowledgeImpl;

// ─────────────────────────────────────────────────────────────
// searchKnowledgeTool — bản bọc LangChain Tool.
//
// So với bookingBrain.js bản cũ (khai báo tay):
//   { type: "function", function: { name, description, parameters: {...} } }
// giờ đây description + schema nằm NGAY CẠNH hàm thực thi, dùng chung 1
// nguồn sự thật (single source of truth) — sửa tham số hàm mà quên sửa
// mô tả cho model là lỗi rất hay gặp khi 2 thứ này tách rời nhau như
// cách làm cũ.
//
// z.enum(...) đảm bảo model CHỈ có thể chọn 1 trong các namespace hợp
// lệ — tương đương "enum" trong JSON schema cũ, nhưng được LangChain tự
// validate input trước khi hàm thực thi chạy (nếu model trả sai kiểu dữ
// liệu, LangChain sẽ báo lỗi rõ ràng thay vì để hàm chạy với input rác).
// ─────────────────────────────────────────────────────────────
export const searchKnowledgeTool = tool(
  async ({ query, namespace, branchName }) => {
    const result = await _searchKnowledgeImpl({ query, namespace, branchName });
    // Agent (createReactAgent) mong đợi tool trả về string (hoặc content
    // block) để đẩy vào ToolMessage — stringify lại để giữ đúng hành vi
    // như bản cũ (messages.push({ role: "tool", content: JSON.stringify(result) })).
    return JSON.stringify(result);
  },
  {
    name: "searchKnowledge",
    description:
      "Tra cứu kiến thức về tóc/dịch vụ, thông tin thợ, hoặc thông tin chi nhánh của Nam Barbershop.",
    schema: z.object({
      query: z.string().describe("Nội dung cần tra cứu, viết tự nhiên bằng tiếng Việt"),
      namespace: z
        .enum(["hairstyles", "colors", "products", "haircare", "barbers", "branches", "services"])
        .describe("Namespace phù hợp với loại thông tin cần tra cứu"),
      branchName: z
        .string()
        .optional()
        .describe(
          "CHỈ dùng khi namespace là 'barbers' hoặc 'services' và khách có nhắc tên chi nhánh cụ thể — truyền đúng tên chi nhánh (vd 'Chi nhánh Quận 1') để lọc đúng chi nhánh đó. Bỏ trống nếu khách không chỉ định chi nhánh hoặc namespace khác."
        ),
    }),
  }
);
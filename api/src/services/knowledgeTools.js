// src/services/knowledgeTools.js

import { createEmbedding } from "./pineconeService.js";
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("project", "project-yfyk5m4.svc.aped-4627-b74a.pinecone.io");

const VALID_NAMESPACES = ["hairstyles", "colors", "products", "haircare"];
const TOP_K = 5;

// ─────────────────────────────────────────────────────────────
// searchKnowledge
// LLM tự chọn namespace dựa vào nội dung câu hỏi
// ─────────────────────────────────────────────────────────────
export async function searchKnowledge({ query, namespace }) {
  if (!VALID_NAMESPACES.includes(namespace)) {
    return {
      success: false,
      error: `Namespace không hợp lệ. Chỉ chấp nhận: ${VALID_NAMESPACES.join(", ")}`,
    };
  }

  try {
    const vec = await createEmbedding(query);
    const res = await index.namespace(namespace).query({
      vector: vec,
      topK: TOP_K,
      includeMetadata: true,
    });

    const matches = res.matches || [];
    if (matches.length === 0) {
      return { success: true, results: [], message: "Không tìm thấy thông tin phù hợp." };
    }

    const results = matches.map((m) => {
      let meta = {};
      try {
        meta = JSON.parse(m.metadata?.metadata || "{}");
      } catch {
        meta = m.metadata || {};
      }
      return {
        score: m.score,
        content: meta.text || meta.content || meta.description || JSON.stringify(meta),
      };
    });

    return { success: true, results };
  } catch (err) {
    console.error(`[knowledgeTools] searchKnowledge error:`, err.message);
    return { success: false, error: err.message };
  }
}
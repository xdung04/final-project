// services/summaryService.js
import { getBarberRevenue, getBranchMonthlyBookingRevenue } from "./statisticsService.js";
import ratingService from "./ratingService.js"; // default export
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_STRATEGIC = "gemini-2.5-flash";   
const GEMINI_MODEL_ANALYTICS = "gemini-2.5-flash";

const taskQueue = [];
let isProcessing = false;
// ---------------------- HELPER ----------------------
async function callGemini(modelName, payload) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY chưa được cấu hình.");

  const finalPayload = {
    ...payload,
    generationConfig: { response_mime_type: "application/json" },
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const headers = { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY };

  try {
    const res = await axios.post(endpoint, finalPayload, { headers });
    const rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(rawText);
  } catch (err) {
    console.error(`Lỗi call Gemini ${modelName}:`, err.response?.data || err.message);
    throw new Error(`Failed to call Gemini ${modelName}`);
  }
}

async function callGeminiForText(modelName, payload) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const headers = { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY };

  try {
    const res = await axios.post(endpoint, payload, { headers });
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    console.error(`Lỗi call Gemini (text) ${modelName}:`, err.response?.data || err.message);
    throw new Error(`Failed to call Gemini ${modelName} for text`);
  }
}

async function preSummarizeJSON(jsonData, dataType) {
  if (!jsonData || (Array.isArray(jsonData) && jsonData.length === 0)) {
    return `Không có dữ liệu về "${dataType}".`;
  }
  const prompt = `Bạn là trợ lý AI phân tích dữ liệu. Tóm tắt các điểm chính từ JSON sau về "${dataType}":\n${JSON.stringify(jsonData, null, 2)}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  return callGeminiForText(GEMINI_MODEL_ANALYTICS, payload);
}

function createFinalJSONPrompt(preSummaries) {
  return `
Bạn là cố vấn kinh doanh ngành barbershop.
Dựa trên phân tích sau, đưa ra nhận định chuyên sâu.

Phân tích đã có:
1. Doanh thu Thợ: ${preSummaries.barberRevenueSummary}
2. Doanh thu Chi nhánh: ${preSummaries.branchRevenueSummary}
3. Đánh giá Thợ: ${preSummaries.ratingsSummary}

**YÊU CẦU:**
Các thông tin bảo mật như ID không được đề cập trong phản hồi.
Phải trả về **JSON hợp lệ duy nhất**, không chứa markdown hay text khác. Cấu trúc:
{
  "barberRevenue": "...",
  "branchRevenue": "...",
  "ratings": "..."
}`;
}

// ---------------------- TASK QUEUE ----------------------
async function processTask(task) {
  // Parse param số từ frontend
  const branchIdLuong = parseInt(task.branchIdLuong, 10);
  const branchIdRating = parseInt(task.branchIdRating, 10);
  const yearLuong = parseInt(task.yearLuong, 10) || new Date().getFullYear();
  const monthLuong = parseInt(task.monthLuong, 10) || new Date().getMonth() + 1;
  const yearChiNhanh = parseInt(task.yearChiNhanh, 10) || new Date().getFullYear();

  console.log("Process task params:", { branchIdLuong, branchIdRating, yearLuong, monthLuong, yearChiNhanh });

  if (!branchIdLuong || !branchIdRating) {
    return task.reject(new Error("branchIdLuong hoặc branchIdRating bị thiếu"));
  }

  try {
    const [barberRevenueData, branchRevenueData, ratingsData] = await Promise.all([
      getBarberRevenue({ year: yearLuong, month: monthLuong, branchId: branchIdLuong }),
      getBranchMonthlyBookingRevenue(yearChiNhanh),
      ratingService.getAllRatingsByBranch(branchIdRating),
    ]);

    const [barberRevenueSummary, branchRevenueSummary, ratingsSummary] = await Promise.all([
      preSummarizeJSON(barberRevenueData, "doanh thu thợ"),
      preSummarizeJSON(branchRevenueData, "doanh thu chi nhánh"),
      preSummarizeJSON(ratingsData, "đánh giá thợ"),
    ]);

    const finalPrompt = createFinalJSONPrompt({ barberRevenueSummary, branchRevenueSummary, ratingsSummary });
    const payload = { contents: [{ parts: [{ text: finalPrompt }] }] };
    const finalJsonObject = await callGemini(GEMINI_MODEL_STRATEGIC, payload);

    task.resolve(finalJsonObject);
  } catch (err) {
    console.error("Lỗi trong processTask:", err);
    task.reject(err);
  }
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;
  while (taskQueue.length > 0) {
    const task = taskQueue.shift();
    await processTask(task);
  }
  isProcessing = false;
}

export function getSummary(params) {
  const branchIdLuong = parseInt(params.branchIdLuong, 10);
  const branchIdRating = parseInt(params.branchIdRating, 10);

  if (isNaN(branchIdLuong) || isNaN(branchIdRating)) {
    return Promise.reject(new Error("branchIdLuong hoặc branchIdRating không hợp lệ"));
  }

  return new Promise((resolve, reject) => {
    taskQueue.push({ ...params, branchIdLuong, branchIdRating, resolve, reject });
    if (!isProcessing) processQueue();
  });
}

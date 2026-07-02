// services/summaryStatisticService.js
import { getBarberRevenue, getBranchMonthlyBookingRevenue,getAIRatingSummary, getAIRatingByFaceShape  } from "./statisticsService.js";
import ratingService from "./ratingService.js";
import { getSeasonContext } from "../utils/seasonContext.js";
import db from "../models/index.js";
import { Sequelize } from "sequelize";
// ─── Gemini client (native fetch — không cần SDK) ─────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = "gemini-2.5-flash";
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const callGemini = async (prompt) => {
  const res = await fetch(GEMINI_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: [
              "You are a JSON-only responder.",
              "Output must be a single valid JSON object — no markdown, no backticks, no prose outside JSON, no newlines inside string values.",
              "You are a senior barbershop business consultant in Vietnam with deep domain expertise.",
              "Analyze data like a real expert: compare to industry benchmarks, name specific barbers,",
              "give concrete numbers, and end every section with a direct actionable recommendation.",
              "Never give vague advice. Always be specific. All string values MUST be in Vietnamese.",
            ].join(" "),
          },
        ],
      },
      generationConfig: {
        temperature:      0.4,
        maxOutputTokens:  2000,
        responseMimeType: "application/json", // ép Gemini trả JSON thuần, không có markdown
        thinkingConfig: {
          thinkingBudget: 0, // tắt thinking — tiết kiệm 88% token, không ảnh hưởng chất lượng task này
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const trimData = (arr = [], n) => arr.slice(0, n ?? arr.length);

const pctChange = (now, last) => {
  if (!last || last === 0) return null;
  return (((now - last) / last) * 100).toFixed(1);
};

const fmtVND = (n) => {
  if (!n && n !== 0) return "N/A";
  return `${(n / 1_000_000).toFixed(1)}M`;
};

// ─── Industry benchmarks ──────────────────────────────────────────────────────

const INDUSTRY_BENCHMARKS = `
INDUSTRY BENCHMARKS (men's barbershop, Vietnam mid-range segment):
- Healthy barber monthly revenue: 15M–30M VND
- Top performer: >30M/month; Underperformer: <10M/month
- Healthy customer volume: 80–150 visits/barber/month
- High volume (>150): barber is a traffic driver, likely lower avg ticket
- Low volume (<50): barber needs booking support or is new
- Tips as % of total: healthy = 10–20%; >20% = strong loyal clientele
- Commission ratio: >60% of total income = heavily volume-dependent, vulnerable if bookings dip
- Avg rating benchmark: excellent ≥ 4.5 (≥10 ratings); acceptable 4.0–4.49; needs action < 4.0
- Barber with < 10 ratings: insufficient data — do NOT draw conclusions from score alone
- YoY branch revenue growth: strong >15%; stable 5–15%; concerning <0%
- Peak months (Vietnam): Dec > Jul > Jun > Aug > pre-Tet; Low: post-Tet, Apr
`.trim();

// ─── Fetch & Transform ────────────────────────────────────────────────────────

const fetchBarberData = async ({ branchId, year, month }) => {
  const [dataNow, dataLast] = await Promise.all([
    getBarberRevenue({ branchId, year, month }),
    getBarberRevenue({ branchId, year: year - 1, month }),
  ]);

  return trimData(
    dataNow.map((d) => {
      const last      = dataLast.find((l) => l.barberId === d.barberId);
      const total     = d.baseSalary + d.tips + d.commission + d.bonus;
      const lastTotal = last ? last.baseSalary + last.tips + last.commission + last.bonus : 0;

      const commissionRatio = total > 0 ? ((d.commission / total) * 100).toFixed(0) : "0";
      const tipsRatio       = total > 0 ? ((d.tips       / total) * 100).toFixed(0) : "0";

      const customerCount     = d.customerCount     ?? null;
      const lastCustomerCount = last?.customerCount ?? null;

      return {
        name:            d.barberName,
        total:           fmtVND(total),
        lastYear:        fmtVND(lastTotal),
        growth:          pctChange(total, lastTotal),
        baseSalary:      fmtVND(d.baseSalary),
        commission:      fmtVND(d.commission),
        commissionRatio: `${commissionRatio}%`,
        tips:            fmtVND(d.tips),
        tipsRatio:       `${tipsRatio}%`,
        bonus:           fmtVND(d.bonus),
        customerCount,
        customerGrowth:  pctChange(customerCount, lastCustomerCount),
      };
    })
  );
};

const fetchBranchData = async ({ branchId, year }) => {
  const bid = Number(branchId);

  const [dataNow, dataLast] = await Promise.all([
    getBranchMonthlyBookingRevenue(year,     bid),
    getBranchMonthlyBookingRevenue(year - 1, bid),
  ]);

  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;

    const nowItem = dataNow.find((d)  => Number(d.month) === m && Number(d.branchId) === bid);
    const lstItem = dataLast.find((d) => Number(d.month) === m && Number(d.branchId) === bid);

    const nowRev = nowItem?.totalRevenue ? Number(nowItem.totalRevenue) : 0;
    const lstRev = lstItem?.totalRevenue ? Number(lstItem.totalRevenue) : 0;

    return {
      month:    `M${m}`,
      current:  fmtVND(nowRev),
      lastYear: fmtVND(lstRev),
      growth:   pctChange(nowRev, lstRev),
    };
  });
};

const fetchRatingData = async ({ branchId }) => {
  const barbers = await ratingService.getAllRatingsByBranch(branchId);

  return trimData(
    barbers.map((b) => {
      const avg          = parseFloat(b.ratingSummary?.avgRate  || 0);
      const totalRatings = parseInt(b.ratingSummary?.totalRate  || 0, 10);

      const tier =
        totalRatings < 10 ? "insufficient_data" :
        avg >= 4.5        ? "excellent"          :
        avg >= 4.0        ? "good"               :
        avg >= 3.5        ? "needs_improvement"  :
                            "critical";

      return {
        name:         b.user?.fullName || "—",
        avgRate:      avg.toFixed(2),
        totalRatings,
        tier,
        dataReliable: totalRatings >= 10,
      };
    })
  );
};

// ─── Prompt Builder ───────────────────────────────────────────────────────────

const buildPrompt = ({
  branchNameLuong, branchNameRating, branchNameChart2,
  year, month, yearChiNhanh,
  barberData, branchData, ratingData,
  seasonCtx,
}) => `
${INDUSTRY_BENCHMARKS}

OUTPUT: Return ONE valid JSON object with exactly 4 fields.
No markdown. No backticks. No text outside the JSON. No newlines inside string values.
{"barberRevenue":"...","branchRevenue":"...","ratings":"...","crossInsight":"..."}

LANGUAGE: All values MUST be in Vietnamese. Write naturally, like a confident manager giving a verbal briefing.
FORMAT per field: 3–5 sentences of fluent prose. No bullet lists. No line breaks inside strings.

═══════════════════════════════════════
SEASONAL CONTEXT — tính từ âm lịch thật, không hardcode
═══════════════════════════════════════
${seasonCtx}

Đối chiếu số liệu với seasonal context:
- Tháng cao điểm mà doanh thu thấp → đáng lo, phân tích nguyên nhân.
- Tháng thấp điểm hoặc có lễ giải thích được → ghi nhận, không đánh giá tiêu cực.

═══════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════

[barberRevenue] → Chi nhánh: ${branchNameLuong} | Kỳ: ${month}/${year}

Step 1 — Volume vs ticket: Nếu có customerCount, phân tích revenue/lượt khách (avg ticket).
  Lượt khách cao + doanh thu trung bình = đang làm giá thấp hoặc upsell kém.
  Lượt khách thấp + doanh thu cao = khách chất lượng, loyal clientele.
  Nếu customerCount = null, bỏ qua bước này.

Step 2 — Income structure: commissionRatio và tipsRatio nói lên gì?
  tipsRatio >15% = tệp khách trung thành rõ rệt.
  commissionRatio >60% = phụ thuộc volume, dễ bị ảnh hưởng nếu booking giảm.

Step 3 — Performance gap: Khoảng cách #1 và barber yếu nhất có bình thường không?
  Benchmark: top >30M, underperformer <10M.

Step 4 — YoY: Chỉ so sánh nếu lastYear ≠ "0.0M". Nếu "0.0M" → barber mới, nói rõ vậy.

Step 5 — Action: Kết bằng 1 hành động cụ thể (tên barber + chỉ số + deadline).

[branchRevenue] → Chi nhánh: ${branchNameChart2} | Năm: ${yearChiNhanh} vs ${yearChiNhanh - 1}

Step 1 — Annual shape: Mô tả đường cong doanh thu năm trong 1 câu.

Step 2 — Standout months: Chọn đúng 2–3 tháng lệch nhiều nhất so với kỳ vọng mùa vụ.
  Dùng seasonal context và benchmark làm chuẩn. Giải thích tại sao lệch.

Step 3 — YoY verdict: Tăng trưởng, đi ngang hay sụt? Đưa % cụ thể nếu data hỗ trợ.

Step 4 — Closing: 1 câu về hệ quả nếu xu hướng tiếp tục 3 tháng tới.

[ratings] → Chi nhánh: ${branchNameRating}

Step 1 — Reliability filter: dataReliable=false → "chưa đủ dữ liệu", không phân tích điểm.

Step 2 — Top talent: Ai có avgRate cao nhất kết hợp totalRatings nhiều nhất? Đặt tên cụ thể.

Step 3 — Risk flag: Ai có tier="critical" hoặc "needs_improvement" với totalRatings cao?
  Đặt tên, nêu điểm số, giải thích rủi ro.

Step 4 — Action: 1 hành động cụ thể (feature top-rated, kế hoạch cải thiện 30 ngày...).

[crossInsight] → Tổng hợp 3 chart

Step 1 — Revenue vs ratings: Top earner có rating tương xứng không?
  Top earner rating thấp → rủi ro mất khách sau khi đạt đỉnh doanh thu.

Step 2 — Branch trend vs individual: Xu hướng chi nhánh có phản ánh đúng hiệu suất cá nhân?
  Tìm điểm mâu thuẫn.

Step 3 — Biggest risk: 1 rủi ro lớn nhất xuyên suốt 3 chart. Cụ thể, thẳng thắn.

Step 4 — TWO actions: Đúng 2 hành động admin cần thực hiện TUẦN NÀY.
  Mỗi action: tên barber hoặc chỉ số cụ thể + deadline.

═══════════════════════════════════════
DATA
═══════════════════════════════════════

CHART1 — Barber revenue | Branch: ${branchNameLuong} | Period: ${month}/${year}
${JSON.stringify(barberData)}

CHART2 — Branch monthly revenue | Branch: ${branchNameChart2} | ${yearChiNhanh} vs ${yearChiNhanh - 1}
${JSON.stringify(branchData)}

CHART3 — Barber ratings | Branch: ${branchNameRating}
${JSON.stringify(ratingData)}
`.trim();

// ─── Main Export ──────────────────────────────────────────────────────────────

export const getSummary = async (params = {}) => {
  const {
    branchIdLuong,  branchNameLuong  = `Branch ${params.branchIdLuong}`,
    branchIdRating, branchNameRating = `Branch ${params.branchIdRating}`,
    branchIdChart2, branchNameChart2 = `Branch ${params.branchIdChart2}`,
    yearLuong    = new Date().getFullYear(),
    monthLuong   = new Date().getMonth() + 1,
    yearChiNhanh = new Date().getFullYear(),
  } = params;

  const _branchIdLuong  = parseInt(branchIdLuong,  10);
  const _branchIdRating = parseInt(branchIdRating, 10);
  const _branchIdChart2 = parseInt(branchIdChart2, 10);
  const _yearLuong      = parseInt(yearLuong,      10);
  const _monthLuong     = parseInt(monthLuong,     10);
  const _yearChiNhanh   = parseInt(yearChiNhanh,   10);

  if (isNaN(_branchIdLuong) || isNaN(_branchIdChart2) || isNaN(_branchIdRating)) {
    console.warn("[getSummary] branchId không hợp lệ:", params);
    return {
      barberRevenue: "Thiếu thông tin chi nhánh.",
      branchRevenue: "Thiếu thông tin chi nhánh.",
      ratings:       "Thiếu thông tin chi nhánh.",
      crossInsight:  "Thiếu thông tin chi nhánh.",
    };
  }

  // ── Season context âm lịch thật — sync, không cần await ──────────────────
  const seasonCtx = getSeasonContext(_monthLuong, _yearLuong);

  const [barberData, branchData, ratingData] = await Promise.all([
    fetchBarberData({ branchId: _branchIdLuong,  year: _yearLuong,    month: _monthLuong }),
    fetchBranchData({ branchId: _branchIdChart2, year: _yearChiNhanh }),
    fetchRatingData({ branchId: _branchIdRating }),
  ]);

  if (process.env.NODE_ENV !== "production") {
    console.log("[getSummary] seasonCtx:", seasonCtx);
    console.log("[getSummary] barberData:", barberData.length, "barbers");
    console.log("[getSummary] branchData sample:", branchData.slice(0, 3));
    console.log("[getSummary] ratingData:", ratingData.length, "barbers");
  }

  const prompt = buildPrompt({
    branchNameLuong,
    branchNameRating,
    branchNameChart2,
    year:         _yearLuong,
    month:        _monthLuong,
    yearChiNhanh: _yearChiNhanh,
    barberData,
    branchData,
    ratingData,
    seasonCtx,
  });

  const raw = await callGemini(prompt);

  try {
    const clean  = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(clean);

    return {
      barberRevenue: parsed.barberRevenue || "Không có dữ liệu.",
      branchRevenue: parsed.branchRevenue || "Không có dữ liệu.",
      ratings:       parsed.ratings       || "Không có dữ liệu.",
      crossInsight:  parsed.crossInsight  || "Không có dữ liệu.",
    };
  } catch (parseErr) {
    console.error("[getSummary] Gemini JSON parse error:", parseErr.message);
    console.error("[getSummary] Raw response:", raw);
    return {
      barberRevenue: "Lỗi phân tích dữ liệu.",
      branchRevenue: "Lỗi phân tích dữ liệu.",
      ratings:       "Lỗi phân tích dữ liệu.",
      crossInsight:  raw,
    };
  }
};
// ─── Fetch AI Data ─────────────────────────────────────────────────────────────
const fetchAIData = async () => {
  const [ratingSummary, ratingByFaceShape, feedbacks] = await Promise.all([
    getAIRatingSummary(),
    getAIRatingByFaceShape(),
    db.HairAnalysis.findAll({
      attributes: ["feedback", "rating", "faceShape"],
      where: {
        feedback: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.ne]: null },
            { [Sequelize.Op.ne]: "" },
          ],
        },
      },
      raw: true,
    }),
  ]);

  return { ratingSummary, ratingByFaceShape, feedbacks };
};

const buildAIPrompt = ({ ratingSummary, ratingByFaceShape, feedbacks }) => `
OUTPUT: Return ONE valid JSON object with exactly 4 fields.
No markdown. No backticks. No text outside the JSON. No newlines inside string values.
{"overview":"...","faceShapeAnalysis":"...","feedbackInsight":"...","action":"..."}

LANGUAGE: All values MUST be in Vietnamese. Fluent prose, no bullet lists, no line breaks inside strings.

BENCHMARKS:
- avgRating ≥ 4.0 = tốt; 3.5–3.99 = cần cải thiện; <3.5 = cần xử lý gấp
- Tỉ lệ satisfied (rating ≥ 4) / total < 60% = tính năng chưa đủ tin cậy

[overview] So sánh avgRating với benchmark. Phân bố sao có đều không? Kết luận tính năng đang ở mức nào.
[faceShapeAnalysis] Khuôn mặt nào AI tốt nhất, yếu nhất? Đặt tên + điểm số cụ thể.
[feedbackInsight] Nếu không có feedback → ghi nhận, không suy diễn. Nếu có → điểm tốt, điểm chưa tốt.
[action] 1 đề xuất cải thiện cụ thể: khuôn mặt nào cần train thêm hoặc UI cần thay đổi gì.

═══════════════════════════════════════
DATA
═══════════════════════════════════════
RatingSummary: ${JSON.stringify(ratingSummary)}
RatingByFaceShape: ${JSON.stringify(ratingByFaceShape)}
Feedbacks (${feedbacks.length}): ${
  feedbacks.length > 0
    ? feedbacks.map((f, i) => `${i + 1}. [${f.faceShape || "?"} - ${f.rating}⭐] ${f.feedback}`).join("\n")
    : "Chưa có feedback nào."
}
`.trim();

export const getAISummary = async () => {
  const aiData = await fetchAIData();
  const prompt = buildAIPrompt(aiData);
  const raw    = await callGemini(prompt);

  try {
    const clean  = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(clean);

    return {
      ratingSummary:    aiData.ratingSummary,
      ratingByFaceShape: aiData.ratingByFaceShape,
      totalFeedbacks:   aiData.feedbacks.length,
      analysis: {
        overview:          parsed.overview          || "Không có dữ liệu.",
        faceShapeAnalysis: parsed.faceShapeAnalysis || "Không có dữ liệu.",
        feedbackInsight:   parsed.feedbackInsight   || "Không có dữ liệu.",
        action:            parsed.action            || "Không có dữ liệu.",
      },
    };
  } catch (parseErr) {
    console.error("[getAISummary] Gemini JSON parse error:", parseErr.message);
    return {
      ratingSummary:    aiData.ratingSummary,
      ratingByFaceShape: aiData.ratingByFaceShape,
      totalFeedbacks:   aiData.feedbacks.length,
      analysis: null,
    };
  }
};
// services/summaryStatisticService.js
import Groq from "groq-sdk";
import { getBarberRevenue, getBranchMonthlyBookingRevenue } from "./statisticsService.js";
import ratingService from "./ratingService.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const trimData = (arr = [], n = 10) => arr.slice(0, n);

const pctChange = (now, last) => {
  if (!last || last === 0) return null;
  return (((now - last) / last) * 100).toFixed(1);
};

const fmtVND = (n) => {
  if (!n && n !== 0) return "N/A";
  return `${(n / 1_000_000).toFixed(1)}M`;
};

// ─── Barbershop domain context ────────────────────────────────────────────────

/**
 * Trả về context mùa vụ ngành barbershop Nam Việt Nam theo tháng
 * Giúp AI có thêm benchmark để phân tích thay vì chỉ nhìn số thuần
 */
const getSeasonContext = (month) => {
  const seasons = {
    1:  "Tháng 1: Sau Tết — khách cắt tóc tất niên đã qua, lượng đặt lịch thường thấp hơn 20-30% so với tháng 12.",
    2:  "Tháng 2: Tháng Tết — biến động lớn nhất năm. Tuần trước Tết đạt đỉnh, sau Tết (nếu rơi vào tháng 2) sụt mạnh. Cần tách 2 giai đoạn khi đánh giá.",
    3:  "Tháng 3: Phục hồi sau Tết — khách quay lại dần, doanh thu ổn định hơn nhưng chưa đạt đỉnh.",
    4:  "Tháng 4: Mùa thấp điểm nhẹ — thời tiết chuyển mùa, khách ít chủ động đặt lịch hơn.",
    5:  "Tháng 5: Ổn định — không có yếu tố mùa vụ đặc biệt, phản ánh trung thực năng lực thực của shop.",
    6:  "Tháng 6: Nghỉ hè bắt đầu — học sinh, sinh viên cắt tóc nhiều hơn. Nhu cầu tạo kiểu mới tăng.",
    7:  "Tháng 7: Cao điểm hè — lượng khách trẻ cao, các dịch vụ tạo kiểu và uốn duỗi có xu hướng tăng.",
    8:  "Tháng 8: Cuối hè — chuẩn bị năm học mới, nhu cầu cắt tóc gọn gàng tăng mạnh cuối tháng.",
    9:  "Tháng 9: Đầu năm học — khách ổn định, ít dao động. Tháng phản ánh rõ nhất chất lượng vận hành.",
    10: "Tháng 10: Bình thường — không có yếu tố kích thích đặc biệt, cạnh tranh giữ chân khách quen.",
    11: "Tháng 11: Chuẩn bị cuối năm — khách bắt đầu chú ý diện mạo cho mùa tiệc tùng, doanh thu nhích dần.",
    12: "Tháng 12: Đỉnh năm — nhu cầu làm tóc trước Tết dương lịch và chuẩn bị Tết âm lịch đẩy doanh thu lên cao nhất năm.",
  };
  return seasons[month] || "";
};

/**
 * Benchmark ngành barbershop Nam phổ thông–trung cấp tại Việt Nam
 * Dùng làm chuẩn để AI đánh giá tốt/xấu có cơ sở
 */
const INDUSTRY_BENCHMARKS = `
INDUSTRY BENCHMARKS (men's barbershop, Vietnam mid-range segment):
- Healthy barber monthly revenue: 15M–30M VND
- Top performer: >30M/month; Underperformer: <10M/month
- Tips as % of total: healthy = 10–20%; very high tips = barber has loyal clientele
- Commission ratio: >50% of total income = barber heavily reliant on volume, risk if bookings dip
- Avg rating benchmark: excellent ≥ 4.5 (≥20 ratings); acceptable 4.0–4.49; needs action < 4.0
- Barber with < 10 ratings: insufficient data — do NOT draw conclusions from score alone
- YoY branch revenue growth: strong >15%; stable 5–15%; concerning <0%
- Peak months (Vietnam): Dec > Jul > Jun > Aug > Feb(pre-Tet); Low: Jan(post-Tet), Apr
`;

// ─── Fetch & Transform data ───────────────────────────────────────────────────

const fetchBarberData = async ({ branchId, year, month }) => {
  const [dataNow, dataLast] = await Promise.all([
    getBarberRevenue({ branchId, year, month }),
    getBarberRevenue({ branchId, year: year - 1, month }),
  ]);

  return trimData(
    dataNow.map((d) => {
      const last      = dataLast.find((l) => l.barberId === d.barberId);
      const total     = d.baseSalary + d.tips + d.commission + d.bonus;
      const lastTotal = last
        ? last.baseSalary + last.tips + last.commission + last.bonus
        : 0;

      // Tính tỉ lệ cơ cấu thu nhập — giúp AI phân tích nguồn lực tạo ra doanh thu
      const commissionRatio = total > 0 ? ((d.commission / total) * 100).toFixed(0) : 0;
      const tipsRatio       = total > 0 ? ((d.tips       / total) * 100).toFixed(0) : 0;

      return {
        name:            d.barberName,
        total:           fmtVND(total),
        lastYear:        fmtVND(lastTotal),
        growth:          pctChange(total, lastTotal),
        baseSalary:      fmtVND(d.baseSalary),
        commission:      fmtVND(d.commission),
        commissionRatio: `${commissionRatio}%`,   // % hoa hồng / tổng
        tips:            fmtVND(d.tips),
        tipsRatio:       `${tipsRatio}%`,          // % tips / tổng — đo độ trung thành khách
        bonus:           fmtVND(d.bonus),
      };
    }),
    10
  );
};

const fetchBranchData = async ({ branchId, year }) => {
  const [dataNow, dataLast] = await Promise.all([
    getBranchMonthlyBookingRevenue(year,     branchId),
    getBranchMonthlyBookingRevenue(year - 1, branchId),
  ]);

  return Array.from({ length: 12 }, (_, i) => {
    const m       = i + 1;
    const nowItem = dataNow.find((d)  => d.month === m && d.branchId === branchId);
    const lstItem = dataLast.find((d) => d.month === m && d.branchId === branchId);
    const nowRev  = nowItem?.totalRevenue || 0;
    const lstRev  = lstItem?.totalRevenue || 0;
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
      const avg          = parseFloat(b.ratingSummary?.avgRate || 0);
      const totalRatings = parseInt(b.ratingSummary?.totalRate || 0);

      // Phân tier rõ ràng hơn — có cả flag thiếu dữ liệu
      const tier =
        totalRatings < 10    ? "insufficient_data" :
        avg >= 4.5           ? "excellent" :
        avg >= 4.0           ? "good" :
        avg >= 3.5           ? "needs_improvement" :
                               "critical";

      return {
        name:         b.user?.fullName || "—",
        avgRate:      avg.toFixed(2),
        totalRatings,
        tier,                                        // AI dùng tier thay vì tự tính lại
        dataReliable: totalRatings >= 10,            // flag rõ ràng cho AI
      };
    }),
    10
  );
};

// ─── Prompt Builder ───────────────────────────────────────────────────────────

const buildPrompt = ({
  branchNameLuong,
  branchNameRating,
  branchNameChart2,
  year,
  month,
  yearChiNhanh,
  barberData,
  branchData,
  ratingData,
}) => {
  const seasonCtx = getSeasonContext(month);

  return `
You are a senior business consultant specializing in men's grooming and barbershop chains in Vietnam.
You think in numbers, spot patterns others miss, and give advice that managers can act on immediately.
You have 10+ years advising barbershop chains on staff performance, revenue optimization, and customer retention.

${INDUSTRY_BENCHMARKS}

OUTPUT: Return ONE valid JSON object with exactly 4 fields.
No markdown. No backticks. No text outside the JSON. No newlines inside string values.
{"barberRevenue":"...","branchRevenue":"...","ratings":"...","crossInsight":"..."}

LANGUAGE: All values MUST be in Vietnamese. Write naturally, like a confident manager giving a verbal briefing.
FORMAT per field: 3–5 sentences of fluent prose. No bullet lists. No line breaks inside strings.

═══════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════

[barberRevenue] → Chi nhánh: ${branchNameLuong} | Kỳ: ${month}/${year}
Seasonal context for this month: ${seasonCtx}

Step 1 — Income structure: Look at commissionRatio and tipsRatio for each barber.
  • High tipsRatio (>15%) = barber has loyal returning clients — strong signal of client ownership.
  • High commissionRatio (>60%) = barber depends heavily on volume — vulnerable if bookings drop.
  • Low commission + high bonus = management rewarding a specific barber for non-revenue reasons — worth noting.

Step 2 — Performance gap: What is the revenue gap between #1 and the weakest? Is it a normal spread or a red flag?
  Compare to industry benchmark: top performer >30M, underperformer <10M.

Step 3 — YoY: Only mention YoY growth if lastYear ≠ "0.0M". If lastYear is "0.0M", that barber is new — say so, don't compare.

Step 4 — Closing insight: End with ONE specific action the branch manager should take (e.g., adjust commission tier, mentor a specific barber, review booking allocation).

[branchRevenue] → Chi nhánh: ${branchNameChart2} | Năm: ${yearChiNhanh} vs ${yearChiNhanh - 1}

Step 1 — Annual shape: Describe the revenue curve in 1 sentence. Is it V-shaped, flat, declining, or seasonal-spiked?

Step 2 — Standout months: Pick exactly 2–3 months that MOST DEVIATE from expected seasonal norms (use INDUSTRY BENCHMARKS peaks/lows above as the norm). Explain why the deviation matters — is it underperformance vs the industry, or overperformance?

Step 3 — YoY verdict: Is the business growing, stagnating, or losing ground vs last year? Give a percentage or ratio if the data supports it. Be direct.

Step 4 — Closing: One sentence on what the trend implies for the next 3 months if nothing changes.

[ratings] → Chi nhánh: ${branchNameRating}

Step 1 — Reliability filter first: Any barber with dataReliable=false has <10 ratings — mention them briefly as "chưa đủ dữ liệu", do not analyze their score.

Step 2 — Top talent: Who has the highest avgRate with the most ratings? Name them. Calculate trust score mentally = avgRate × log(totalRatings) — the barber with the best combination of score + volume is the strongest asset.

Step 3 — Risk flag: Any barber with tier="critical" (avgRate < 3.5) or tier="needs_improvement" with high totalRatings is a reputational risk — name them, state the score, flag the risk.

Step 4 — Closing: One specific action (e.g., feature the top-rated barber in marketing, put the critical barber on a 30-day improvement plan with supervisor review).

[crossInsight] → Cross-chart correlation

Step 1 — Revenue vs ratings alignment: Do the highest-earning barbers in Chart 1 also have strong ratings in Chart 3? If yes, that's healthy. If the top earner has weak ratings — that's a churn risk (high revenue now, client flight later).

Step 2 — Branch trend vs individual performance: Does the branch revenue trend in Chart 2 reflect what the individual barber data in Chart 1 suggests about this period? Look for disconnects.

Step 3 — Biggest risk: State the single most concerning pattern you see across all 3 charts combined. Be specific and direct.

Step 4 — TWO concrete actions: End with exactly 2 actions the admin should execute THIS WEEK. Make them specific (name a barber, name a metric, name a deadline) — not generic advice.

═══════════════════════════════════════
DATA
═══════════════════════════════════════

CHART1 — Barber revenue | Branch: ${branchNameLuong} | Period: ${month}/${year}
${JSON.stringify(barberData, null, 0)}

CHART2 — Branch monthly revenue | Branch: ${branchNameChart2} | ${yearChiNhanh} vs ${yearChiNhanh - 1}
${JSON.stringify(branchData, null, 0)}

CHART3 — Barber ratings | Branch: ${branchNameRating}
${JSON.stringify(ratingData, null, 0)}
`.trim();
};

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Lấy tổng hợp phân tích AI cho 3 biểu đồ thống kê
 *
 * @param {Object} params
 *  - branchIdLuong, branchNameLuong   : chi nhánh biểu đồ 1
 *  - branchIdRating, branchNameRating : chi nhánh biểu đồ 3
 *  - branchIdChart2, branchNameChart2 : chi nhánh biểu đồ 2
 *  - yearLuong, monthLuong            : filter biểu đồ 1
 *  - yearChiNhanh                     : filter biểu đồ 2
 *
 * @returns {{ barberRevenue, branchRevenue, ratings, crossInsight }}
 */
export const getSummary = async (params = {}) => {
  const {
    branchIdLuong,  branchNameLuong  = `Branch ${branchIdLuong}`,
    branchIdRating, branchNameRating = `Branch ${branchIdRating}`,
    branchIdChart2, branchNameChart2 = `Branch ${branchIdChart2}`,
    yearLuong    = new Date().getFullYear(),
    monthLuong   = new Date().getMonth() + 1,
    yearChiNhanh = new Date().getFullYear(),
  } = params;

  const [barberData, branchData, ratingData] = await Promise.all([
    fetchBarberData({ branchId: branchIdLuong,  year: yearLuong,    month: monthLuong }),
    fetchBranchData({ branchId: branchIdChart2, year: yearChiNhanh }),
    fetchRatingData({ branchId: branchIdRating }),
  ]);

  const prompt = buildPrompt({
    branchNameLuong,
    branchNameRating,
    branchNameChart2,
    year:        yearLuong,
    month:       monthLuong,
    yearChiNhanh,
    barberData,
    branchData,
    ratingData,
  });

  const response = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    max_tokens:  1500,    // tăng lên để cho phép phân tích sâu hơn
    temperature: 0.25,    // thấp hơn nữa → nhất quán, ít hallucinate
    messages: [
      {
        role:    "system",
        content: [
          "You are a JSON-only responder. Output must be a single valid JSON object.",
          "No markdown, no prose outside the JSON, no backticks, no newlines inside string values.",
          "You are a senior barbershop business consultant in Vietnam with deep domain expertise.",
          "You analyze data like a real expert: you compare to industry benchmarks, name specific barbers,",
          "give concrete numbers, and end every section with a direct, actionable recommendation.",
          "Never give vague advice. Always be specific. All string values MUST be in Vietnamese.",
        ].join(" "),
      },
      {
        role:    "user",
        content: prompt,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() || "{}";

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
    console.error("Groq JSON parse error:", parseErr.message);
    console.error("Raw response:", raw);

    return {
      barberRevenue: "Lỗi phân tích dữ liệu.",
      branchRevenue: "Lỗi phân tích dữ liệu.",
      ratings:       "Lỗi phân tích dữ liệu.",
      crossInsight:  raw,
    };
  }
};
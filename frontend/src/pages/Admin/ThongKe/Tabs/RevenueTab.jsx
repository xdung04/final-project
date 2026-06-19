import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LabelList, ReferenceLine,
  ComposedChart, Line, Cell,
} from "recharts";
import classNames from "classnames/bind";
import styles from "./RevenueTab.module.scss";
import { StatisticsAPI } from "~/apis/statisticsAPI";
import { BranchAPI } from "~/apis/branchAPI";
import { RatingAPI } from "~/apis/ratingAPI";
import { SummaryAPI } from "~/apis/summaryAPI";

const cx = classNames.bind(styles);

// ─── CẤU HÌNH HỆ THỐNG MÀU SẮC GIAO DIỆN ─────────────────────────────────────
const COLOR = {
  gold:      "#C9A84C",
  goldDim:   "#A8893A",
  goldFaint: "rgba(201,168,76,0.15)",
  teal:      "#2A9D8F",
  tealLight: "#3DB9AA",
  ink:       "#1C1814",
  ink2:      "#3D3530",
  brown1:    "#5D4037",
  brown2:    "#8D6E63",
  red:       "#E57373",
  gridLine:  "#EDEBE6",
  axisText:  "#7A7068",
};

const fullMonths     = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
const currentYear    = new Date().getFullYear();
const currentMonth   = new Date().getMonth() + 1;
const availableYears = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

// Hàm rút gọn tên hiển thị (Ví dụ: Nguyễn Văn Anh -> N.V.Anh)
const shortName = (name = "") => {
  const parts = name.trim().split(" ");
  if (parts.length <= 1) return name;
  const initials = parts.slice(0, -1).map((p) => p[0] + ".").join("");
  return `${initials} ${parts[parts.length - 1]}`;
};

const calcGrowth = (current, last) => {
  if (!last || last === 0) return null;
  return (((current - last) / last) * 100).toFixed(1);
};

const getRatingColor = (score) => {
  if (score >= 4.5) return COLOR.gold;
  if (score >= 4.0) return COLOR.teal;
  return COLOR.red;
};

const buildBranchChartData = (dataNamNay, dataNamNgoai) =>
  fullMonths.map((m, index) => {
    const mn      = index + 1;
    const nowItem  = dataNamNay.find((d)  => d.month === mn);
    const lastItem = dataNamNgoai.find((d) => d.month === mn);
    return {
      month:    m,
      namNay:   nowItem?.totalRevenue  || 0,
      namNgoai: lastItem?.totalRevenue || 0,
    };
  });

// ─── CẤU HÌNH TOOLTIPS TƯƠNG TÁC BIỂU ĐỒ ──────────────────────────────────────
const tooltipBase = {
  background: "#fff",
  border: "1px solid #E8E4DC",
  borderRadius: 10,
  padding: "12px 16px",
  fontSize: 12.5,
  boxShadow: "0 6px 24px rgba(0,0,0,0.10)",
  minWidth: 210,
};

const Row = ({ label, val, color }) => (
  <p style={{ margin: "2px 0", color: "#555" }}>
    {label}: <b style={{ color }}>{val?.toLocaleString("vi-VN")}đ</b>
  </p>
);

const BarberTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d         = payload[0]?.payload;
  const total     = (d.baseSalary||0) + (d.tips||0) + (d.commission||0) + (d.bonus||0);
  const growth    = d.growth;
  return (
    <div style={tooltipBase}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: COLOR.ink, fontSize: 13 }}>{d.barberName}</p>
      <Row label="Lương cố định" val={d.baseSalary} color={COLOR.ink}    />
      <Row label="Hoa hồng"      val={d.commission} color={COLOR.brown2} />
      <Row label="Tiền tip"      val={d.tips}       color={COLOR.brown1} />
      <Row label="Thưởng"        val={d.bonus}      color={COLOR.gold}   />
      <hr style={{ margin: "8px 0", borderColor: "#EDEBE6", borderWidth: "1px 0 0" }} />
      <p style={{ fontWeight: 700, color: COLOR.ink }}>Tháng này: {total.toLocaleString("vi-VN")}đ</p>
      <p style={{ color: "#AAA", marginTop: 2 }}>Cùng kỳ: {d.lastYearTotal?.toLocaleString("vi-VN") ?? "—"}đ</p>
      {growth !== null && (
        <p style={{ fontWeight: 700, color: parseFloat(growth) >= 0 ? "#1E7F4E" : "#C62828", marginTop: 5 }}>
          {parseFloat(growth) >= 0 ? "▲" : "▼"} {Math.abs(growth)}% so với cùng kỳ
        </p>
      )}
    </div>
  );
};

const BranchTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const namNay   = payload.find((p) => p.dataKey === "namNay")?.value   || 0;
  const namNgoai = payload.find((p) => p.dataKey === "namNgoai")?.value || 0;
  const growth   = calcGrowth(namNay, namNgoai);
  return (
    <div style={tooltipBase}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: COLOR.ink }}>{label}</p>
      <p style={{ color: COLOR.teal }}>Năm nay: <b>{namNay.toLocaleString("vi-VN")}đ</b></p>
      <p style={{ color: "#AAA", marginTop: 3 }}>Năm ngoái: <b>{namNgoai.toLocaleString("vi-VN")}đ</b></p>
      {growth !== null && (
        <p style={{ fontWeight: 700, marginTop: 6, color: parseFloat(growth) >= 0 ? "#1E7F4E" : "#C62828" }}>
          {parseFloat(growth) >= 0 ? "▲" : "▼"} {Math.abs(growth)}% so với cùng kỳ
        </p>
      )}
    </div>
  );
};

const RatingTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d     = payload[0]?.payload;
  const trust = d.totalRatings >= 20 ? "Cao ✓" : d.totalRatings >= 5 ? "Trung bình" : "Thấp (ít lượt)";
  const trustColor = d.totalRatings >= 20 ? COLOR.teal : d.totalRatings >= 5 ? COLOR.gold : COLOR.red;
  return (
    <div style={tooltipBase}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: COLOR.ink }}>{d.name}</p>
      <p>Điểm TB: <b style={{ color: getRatingColor(d.score) }}>{d.score}/5</b></p>
      <p style={{ marginTop: 3 }}>Số lượt: <b>{d.totalRatings} đánh giá</b></p>
      <p style={{ marginTop: 3, color: "#888" }}>Độ tin cậy: <b style={{ color: trustColor }}>{trust}</b></p>
    </div>
  );
};

const GrowthLabel = ({ x, y, width, index, data }) => {
  const d = data?.[index];
  if (!d || d.growth === null || d.growth === undefined) return null;
  const isPos = parseFloat(d.growth) >= 0;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fill={isPos ? "#1E7F4E" : "#C62828"} fontSize={10} fontWeight={700}>
      {isPos ? "+" : ""}{d.growth}%
    </text>
  );
};

const DEFAULT_AI_TEXT = "Nhấn nút để kích hoạt Trợ lý AI phân tích...";
const STALE_AI_TEXT = "Dữ liệu bộ lọc đã đổi. Nhấn nút để AI phân tích lại...";

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
function RevenueTab() {
  const [branchList, setBranchList] = useState([]);
  
  // 1. MỘT BỘ LỌC TỔNG DUY NHẤT (GLOBAL FILTER)
  const [filter, setFilter] = useState({
    branchId: null,
    branchName: "",
    year: currentYear,
    month: currentMonth
  });

  // State lưu trữ dữ liệu thô phục vụ biểu đồ
  const [dataLuong,         setDataLuong]         = useState([]);
  const [dataLuongLastYear, setDataLuongLastYear]  = useState([]);
  const [dataChiNhanh,      setDataChiNhanh]       = useState([]);
  const [dataChiNhanhLast,  setDataChiNhanhLast]   = useState([]);
  const [satisfactionData,  setSatisfactionData]   = useState([]);

  // STATE BỘ NHỚ ĐỆM AI (Đọc từ sessionStorage khi F5 trang)
  const [aiCache, setAiCache] = useState(() => {
    try {
      const savedCache = sessionStorage.getItem("ai_summary_cache");
      return savedCache ? JSON.parse(savedCache) : {};
    } catch (e) {
      console.error("Lỗi khởi tạo aiCache từ sessionStorage:", e);
      return {};
    }
  });

  // State lưu trữ bài phân tích của Trợ lý AI hiện tại đang hiển thị
  const [aiSummaries, setAiSummaries] = useState({
    barberRevenue: DEFAULT_AI_TEXT,
    branchRevenue: DEFAULT_AI_TEXT,
    ratings:       DEFAULT_AI_TEXT,
    crossInsight:  DEFAULT_AI_TEXT,
  });

  // Loading States độc lập
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [loadingAI,     setLoadingAI]     = useState(false);

  // Khởi tạo danh sách Chi nhánh ban đầu
  useEffect(() => {
    BranchAPI.getAll()
      .then((res) => {
        setBranchList(res);
        if (res.length > 0) {
          setFilter((prev) => ({
            ...prev,
            branchId: res[0].idBranch,
            branchName: res[0].name
          }));
        }
      })
      .catch(console.error);
  }, []);

  // 2. TẢI DỮ LIỆU SỐ LIỆU THÔ (Tự động chạy song song khi Bộ lọc tổng thay đổi)
  const fetchChartsData = useCallback(async () => {
    if (!filter.branchId) return;
    setLoadingCharts(true);

    try {
      const [resLuong, resChiNhanh, resRating] = await Promise.all([
        Promise.all([
          StatisticsAPI.getBarberRevenue({ year: filter.year, month: filter.month, branchId: filter.branchId }),
          StatisticsAPI.getBarberRevenue({ year: filter.year - 1, month: filter.month, branchId: filter.branchId }),
        ]),
        Promise.all([
          StatisticsAPI.getMonthlyBranchRevenue({ year: filter.year, branchId: filter.branchId }),
          StatisticsAPI.getMonthlyBranchRevenue({ year: filter.year - 1, branchId: filter.branchId }),
        ]),
        RatingAPI.getByBranch(filter.branchId)
      ]);

      // Cập nhật biểu đồ 1
      setDataLuong(resLuong[0]);
      setDataLuongLastYear(resLuong[1]);
      
      // Cập nhật biểu đồ 2
      setDataChiNhanh(resChiNhanh[0]);
      setDataChiNhanhLast(resChiNhanh[1]);
      
      // Cập nhật biểu đồ 3
      setSatisfactionData(
        resRating.map((b) => ({
          name:         b.user?.fullName || "—",
          score:        parseFloat(b.ratingSummary?.avgRate || 0),
          totalRatings: b.ratingSummary?.totalRate || 0,
        }))
      );

      // KIỂM TRA XEM FILTER MỚI ĐÃ CÓ TRONG CACHE CHƯA KHI ĐỔI FILTER HOẶC F5 TRANG
      const cacheKey = `${filter.branchId}_${filter.year}_${filter.month}`;
      if (aiCache[cacheKey]) {
        setAiSummaries(aiCache[cacheKey]);
      } else {
        setAiSummaries({
          barberRevenue: STALE_AI_TEXT,
          branchRevenue: STALE_AI_TEXT,
          ratings:       STALE_AI_TEXT,
          crossInsight:  STALE_AI_TEXT,
        });
      }

    } catch (err) {
      console.error("Lỗi khi tải dữ liệu biểu đồ:", err);
    } finally {
      setLoadingCharts(false);
    }
  }, [filter.branchId, filter.year, filter.month, aiCache]);

  useEffect(() => {
    fetchChartsData();
  }, [fetchChartsData]);


  // 3. HÀM GỌI TRỢ LÝ AI (KIỂM TRA CACHE TRÊN CẢ STATE VÀ SESSIONSTORAGE)
  const handleFetchAiSummary = async () => {
    if (!filter.branchId) return;

    const cacheKey = `${filter.branchId}_${filter.year}_${filter.month}`;

    // NẾU KHỚP CACHE -> Đọc tức thì, ngăn chặn gọi API
    if (aiCache[cacheKey]) {
      setAiSummaries(aiCache[cacheKey]);
      return;
    }

    // NẾU CHƯA CÓ TRONG CACHE -> Tiến hành gọi Server AI
    setLoadingAI(true);
    setAiSummaries({
      barberRevenue: "AI đang quét biểu đồ thợ...",
      branchRevenue: "AI đang phân tích xu hướng năm...",
      ratings:       "AI đang đánh giá chất lượng phục vụ...",
      crossInsight:  "AI đang tiến hành phân tích tổng hợp chéo...",
    });

    try {
      const res = await SummaryAPI.getSummary({
        branchIdLuong: filter.branchId,   branchNameLuong: filter.branchName,
        branchIdRating: filter.branchId,  branchNameRating: filter.branchName,
        branchIdChart2: filter.branchId,  branchNameChart2: filter.branchName,
        yearLuong: filter.year,           monthLuong: filter.month,
        yearChiNhanh: filter.year,
      });

      // Ghi nhận đồng thời vào React State và sessionStorage của trình duyệt
      setAiCache((prev) => {
        const updated = { ...prev, [cacheKey]: res };
        sessionStorage.setItem("ai_summary_cache", JSON.stringify(updated));
        return updated;
      });
      
      setAiSummaries(res);
    } catch (err) {
      setAiSummaries({
        barberRevenue: "Không thể kết nối với Trợ lý AI.",
        branchRevenue: "Không thể kết nối với Trợ lý AI.",
        ratings:       "Không thể kết nối với Trợ lý AI.",
        crossInsight:  "Không thể kết nối với Trợ lý AI.",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // ── Xử lý trộn dữ liệu Thợ ────────────────────────────────────────────────
  const mergedBarberData = dataLuong.map((d) => {
    const last      = dataLuongLastYear.find((l) => l.barberId === d.barberId);
    const total     = (d.baseSalary||0) + (d.tips||0) + (d.commission||0) + (d.bonus||0);
    const lastTotal = last ? (last.baseSalary||0)+(last.tips||0)+(last.commission||0)+(last.bonus||0) : 0;
    return { ...d, shortName: shortName(d.barberName), total, lastYearTotal: lastTotal, growth: calcGrowth(total, lastTotal) };
  });

  const avgBarberRevenue = mergedBarberData.length
    ? mergedBarberData.reduce((s, d) => s + d.total, 0) / mergedBarberData.length
    : 0;

  const chart2Data = buildBranchChartData(dataChiNhanh, dataChiNhanhLast);
  const barberChartHeight = Math.max(380, mergedBarberData.length * 60);
  const barSize = mergedBarberData.length
    ? Math.min(48, Math.max(20, Math.floor((barberChartHeight - 80) / mergedBarberData.length * 0.55)))
    : 40;

  return (
    <div className={cx("thongke")}>

      {/* ≡ THANH BỘ LỌC TỔNG (GLOBAL FILTER BAR) */}
      <div className={cx("globalFilterBar")}>
        <div className={cx("filterGroup")}>
          <label>Chi nhánh:</label>
          <select 
            value={filter.branchId || ""} 
            onChange={(e) => {
              const selected = branchList.find(b => b.idBranch === parseInt(e.target.value));
              if (selected) setFilter({ ...filter, branchId: selected.idBranch, branchName: selected.name });
            }}
          >
            {branchList.map((b) => <option key={b.idBranch} value={b.idBranch}>{b.name}</option>)}
          </select>

          <label>Năm:</label>
          <select value={filter.year} onChange={(e) => setFilter({ ...filter, year: parseInt(e.target.value) })}>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <label>Tháng:</label>
          <select value={filter.month} onChange={(e) => setFilter({ ...filter, month: parseInt(e.target.value) })}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (<option key={m} value={m}>Tháng {m}</option>))}
          </select>
        </div>

        {/* NÚT TRIGGER AI DUY NHẤT CHO TOÀN TRANG */}
        <button className={cx("aiTriggerBtn")} onClick={handleFetchAiSummary} disabled={loadingAI || loadingCharts}>
          {loadingAI ? "🤖 Đang phân tích dữ liệu..." : "🤖 Phân tích toàn diện bằng AI"}
        </button>
      </div>

      {loadingCharts && <div className={cx("globalLoading")}>Đang làm mới số liệu biểu đồ...</div>}

      {/* ══ BIỂU ĐỒ 1 — Doanh thu theo thợ ══════════════════════════════ */}
      <div className={cx("chartBox")}>
        <div className={cx("boxHeader")}>
          <h3 className={cx("chartTitle")}>Doanh thu theo thợ (Tháng {filter.month}/{filter.year})</h3>
        </div>
        <div className={cx("chartContent")}>
          <div className={cx("chartWrapper")}>
            <ResponsiveContainer width="100%" height={barberChartHeight}>
              <BarChart data={mergedBarberData} layout="vertical" margin={{ top: 8, right: 110, left: 8, bottom: 8 }} barCategoryGap="30%" maxBarSize={barSize}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.gridLine} horizontal={false} />
                <YAxis type="category" dataKey="shortName" width={90} tick={{ fontSize: 12, fill: COLOR.ink2, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
                <XAxis type="number" stroke={COLOR.axisText} tick={{ fontSize: 10, fill: COLOR.axisText }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} axisLine={{ stroke: COLOR.gridLine }} tickLine={false} />
                <Tooltip content={<BarberTooltip />} cursor={{ fill: "rgba(201,168,76,0.06)" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: COLOR.axisText }} iconType="circle" iconSize={8} />
                <ReferenceLine x={avgBarberRevenue} stroke={COLOR.gold} strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `TB: ${(avgBarberRevenue / 1_000_000).toFixed(1)}M`, position: "top", fill: COLOR.gold, fontSize: 10, fontWeight: 600 }} />
                <Bar dataKey="baseSalary" stackId="a" fill="#2C2420" name="Lương cố định" radius={[4,0,0,4]} />
                <Bar dataKey="tips"       stackId="a" fill="#7B5C52" name="Tiền tip" />
                <Bar dataKey="commission" stackId="a" fill="#B08878" name="Hoa hồng" />
                <Bar dataKey="bonus"      stackId="a" fill={COLOR.gold} name="Thưởng" radius={[0,4,4,0]}>
                  <LabelList content={(props) => <GrowthLabel {...props} data={mergedBarberData} />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={cx("aiAnalysis")}>
            <h4>AI Phân tích</h4>
            <p className={cx({ "loading-text": loadingAI })}>{aiSummaries.barberRevenue}</p>
          </div>
        </div>
      </div>

      {/* ══ BIỂU ĐỒ 2 — Doanh thu chi nhánh theo năm ═══════════════════ */}
      <div className={cx("chartBox")}>
        <div className={cx("boxHeader")}>
          <h3 className={cx("chartTitle")}>Xu hướng Doanh thu Chi nhánh (Năm {filter.year} vs {filter.year - 1})</h3>
        </div>
        <div className={cx("chartContent")}>
          <div className={cx("chartWrapper")}>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={chart2Data} margin={{ top: 16, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.gridLine} vertical={false} />
                <XAxis dataKey="month" stroke={COLOR.axisText} tick={{ fontSize: 11, fill: COLOR.axisText }} axisLine={{ stroke: COLOR.gridLine }} tickLine={false} />
                <YAxis stroke={COLOR.axisText} tick={{ fontSize: 11, fill: COLOR.axisText }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                <Tooltip content={<BranchTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: COLOR.axisText }} formatter={(value) => value === "namNay" ? `Năm ${filter.year}` : `Năm ${filter.year - 1}`} />
                <Bar dataKey="namNay" fill={COLOR.teal} name="namNay" radius={[4,4,0,0]} maxBarSize={40} />
                <Line type="monotone" dataKey="namNgoai" stroke={COLOR.gold} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3.5, fill: COLOR.gold, strokeWidth: 0 }} activeDot={{ r: 5 }} name="namNgoai" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className={cx("aiAnalysis")}>
            <h4>AI Phân tích</h4>
            <p className={cx({ "loading-text": loadingAI })}>{aiSummaries.branchRevenue}</p>
          </div>
        </div>
      </div>

      {/* ══ BIỂU ĐỒ 3 — Đánh giá thợ ══════════════════════════════════ */}
      <div className={cx("chartBox")}>
        <div className={cx("boxHeader")}>
          <h3 className={cx("chartTitle")}>Độ hài lòng của khách hàng tại chi nhánh</h3>
        </div>
        <div className={cx("chartContent")}>
          <div className={cx("chartWrapper")}>
            <ResponsiveContainer width="100%" height={Math.max(340, satisfactionData.length * 44)}>
              <BarChart data={satisfactionData} layout="vertical" margin={{ top: 8, right: 80, left: 8, bottom: 8 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.gridLine} horizontal={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: COLOR.ink2, fontWeight: 500 }} tickFormatter={shortName} axisLine={false} tickLine={false} interval={0} />
                <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke={COLOR.axisText} tick={{ fontSize: 10, fill: COLOR.axisText }} axisLine={{ stroke: COLOR.gridLine }} tickLine={false} />
                <Tooltip content={<RatingTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: COLOR.axisText }} />
                <ReferenceLine x={4.0} stroke={COLOR.red} strokeDasharray="5 4" strokeWidth={1.5} label={{ value: "Ngưỡng 4.0", position: "top", fill: COLOR.red, fontSize: 10, fontWeight: 600 }} />
                <Bar dataKey="score" name="Điểm hài lòng" maxBarSize={36} radius={[0,6,6,0]}>
                  {satisfactionData.map((entry, index) => (<Cell key={index} fill={getRatingColor(entry.score)} />))}
                  <LabelList dataKey="score" position="right" formatter={(v) => `${v}/5`} style={{ fontSize: 11, fill: COLOR.ink2, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={cx("aiAnalysis")}>
            <h4>AI Phân tích</h4>
            <p className={cx({ "loading-text": loadingAI })}>{aiSummaries.ratings}</p>
          </div>
        </div>
      </div>

      {/* ══ CROSS INSIGHT ═══════════════════════════════════════════════ */}
      <div className={cx("chartBox")}>
        <div className={cx("boxHeader")}>
          <h3 className={cx("chartTitle")}>Phân tích chéo tổng hợp toàn chi nhánh</h3>
        </div>
        <div className={cx("aiAnalysis", "crossInsight")}>
          <h4>AI Cross Insight</h4>
          <p className={cx({ "loading-text": loadingAI })}>{aiSummaries.crossInsight}</p>
        </div>
      </div>

    </div>
  );
}

export default RevenueTab;
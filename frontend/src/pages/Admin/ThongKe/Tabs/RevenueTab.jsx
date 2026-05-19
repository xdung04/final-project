import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LabelList, ReferenceLine,
  ComposedChart, Line, Cell,
} from "recharts";
import * as XLSX from "xlsx";
import classNames from "classnames/bind";
import styles from "./RevenueTab.module.scss";
import { StatisticsAPI } from "~/apis/statisticsAPI";
import { BranchAPI } from "~/apis/branchAPI";
import { RatingAPI } from "~/apis/ratingAPI";
import { SummaryAPI } from "~/apis/summaryAPI";

const cx = classNames.bind(styles);

// ─── Design Tokens (đồng bộ với SCSS) ────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────
const fullMonths = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const availableYears = Array.from(
  { length: currentYear - 2024 + 1 },
  (_, i) => 2024 + i
);

const shortName = (name = "") => {
  const parts = name.trim().split(" ");
  if (parts.length <= 1) return name;
  const initials = parts.slice(0, -1).map((p) => p[0] + ".").join("");
  return `${initials}${parts[parts.length - 1]}`;
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
    const mn = index + 1;
    const nowItem  = dataNamNay.find((d)  => d.month === mn);
    const lastItem = dataNamNgoai.find((d) => d.month === mn);
    return {
      month:    m,
      namNay:   nowItem?.totalRevenue  || 0,
      namNgoai: lastItem?.totalRevenue || 0,
    };
  });

function exportToExcel(data, fileName) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// ─── Custom Axis Tick ────────────────────────────────────────
const CustomXTick = ({ x, y, payload }) => (
  <text x={x} y={y + 12} textAnchor="middle" fill={COLOR.axisText} fontSize={11}>
    {payload.value}
  </text>
);

// ─── Custom Tooltips ─────────────────────────────────────────
const tooltipBase = {
  background: "#fff",
  border: "1px solid #E8E4DC",
  borderRadius: 10,
  padding: "12px 16px",
  fontSize: 12.5,
  boxShadow: "0 6px 24px rgba(0,0,0,0.10)",
  minWidth: 200,
};

const BarberTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const total  = (d.baseSalary||0) + (d.tips||0) + (d.commission||0) + (d.bonus||0);
  const growth = d.growth;
  return (
    <div style={tooltipBase}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: COLOR.ink, fontSize: 13 }}>
        {d.barberName}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Row label="Lương cố định" val={d.baseSalary} color={COLOR.ink} />
        <Row label="Tiền tip"      val={d.tips}       color={COLOR.brown1} />
        <Row label="Hoa hồng"      val={d.commission} color={COLOR.brown2} />
        <Row label="Thưởng"        val={d.bonus}      color={COLOR.gold} />
      </div>
      <hr style={{ margin: "8px 0", borderColor: "#EDEBE6", borderWidth: "1px 0 0" }} />
      <p style={{ fontWeight: 700, color: COLOR.ink }}>
        Tháng này: {total.toLocaleString("vi-VN")}đ
      </p>
      <p style={{ color: "#AAA", marginTop: 2 }}>
        Cùng kỳ năm ngoái: {d.lastYearTotal?.toLocaleString("vi-VN")}đ
      </p>
      {growth !== null && growth !== undefined && (
        <p style={{
          fontWeight: 700,
          color: parseFloat(growth) >= 0 ? "#1E7F4E" : "#C62828",
          marginTop: 5,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          {parseFloat(growth) >= 0 ? "▲" : "▼"} {Math.abs(growth)}% so với cùng kỳ
        </p>
      )}
    </div>
  );
};

const Row = ({ label, val, color }) => (
  <p style={{ margin: 0, color: "#555" }}>
    {label}: <b style={{ color }}>{val?.toLocaleString("vi-VN")}đ</b>
  </p>
);

const BranchTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const namNay   = payload.find((p) => p.dataKey === "namNay")?.value   || 0;
  const namNgoai = payload.find((p) => p.dataKey === "namNgoai")?.value || 0;
  const growth   = calcGrowth(namNay, namNgoai);
  return (
    <div style={tooltipBase}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: COLOR.ink }}>{label}</p>
      <p style={{ color: COLOR.teal }}>
        Năm nay: <b>{namNay.toLocaleString("vi-VN")}đ</b>
      </p>
      <p style={{ color: "#AAA", marginTop: 3 }}>
        Năm ngoái: <b>{namNgoai.toLocaleString("vi-VN")}đ</b>
      </p>
      {growth !== null && (
        <p style={{
          fontWeight: 700,
          marginTop: 6,
          color: parseFloat(growth) >= 0 ? "#1E7F4E" : "#C62828",
        }}>
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
      <p style={{ marginTop: 3, color: "#888" }}>
        Độ tin cậy: <b style={{ color: trustColor }}>{trust}</b>
      </p>
    </div>
  );
};

// ─── Component ───────────────────────────────────────────────
function RevenueTab() {
  const [branchList,   setBranchList]   = useState([]);
  const [branchLuong,  setBranchLuong]  = useState(null);
  const [branchRating, setBranchRating] = useState(null);
  const [branchChart2, setBranchChart2] = useState(null);

  const [filterLuong,    setFilterLuong]    = useState({ year: currentYear, month: currentMonth });
  const [filterChiNhanh, setFilterChiNhanh] = useState({ year: currentYear });

  const [dataLuong,         setDataLuong]        = useState([]);
  const [dataLuongLastYear, setDataLuongLastYear] = useState([]);
  const [dataChiNhanh,      setDataChiNhanh]      = useState([]);
  const [dataChiNhanhLast,  setDataChiNhanhLast]  = useState([]);
  const [satisfactionData,  setSatisfactionData]  = useState([]);

  const [aiSummaries, setAiSummaries] = useState({
    barberRevenue: "Chọn bộ lọc để AI phân tích...",
    branchRevenue: "Chọn bộ lọc để AI phân tích...",
    ratings:       "Chọn chi nhánh để AI phân tích...",
    crossInsight:  "Chọn bộ lọc để AI phân tích...",
  });

  const [loadingSummary,      setLoadingSummary]      = useState(false);
  const [loadingLuong,        setLoadingLuong]        = useState(false);
  const [loadingChiNhanh,     setLoadingChiNhanh]     = useState(false);
  const [loadingSatisfaction, setLoadingSatisfaction] = useState(false);

  // === Fetch Branches ===
  useEffect(() => {
    BranchAPI.getAll()
      .then((res) => {
        setBranchList(res);
        if (res.length > 0) {
          setBranchLuong(res[0]);
          setBranchRating(res[0]);
          setBranchChart2(res[0]);
        }
      })
      .catch((err) => console.error("Lỗi load chi nhánh:", err));
  }, []);

  // === Fetch Barber Revenue ===
  const fetchBarberRevenue = useCallback(async () => {
    if (!branchLuong) return;
    setLoadingLuong(true);
    try {
      const [dataNow, dataLast] = await Promise.all([
        StatisticsAPI.getBarberRevenue({
          year: filterLuong.year, month: filterLuong.month, branchId: branchLuong.idBranch,
        }),
        StatisticsAPI.getBarberRevenue({
          year: filterLuong.year - 1, month: filterLuong.month, branchId: branchLuong.idBranch,
        }),
      ]);
      setDataLuong(dataNow);
      setDataLuongLastYear(dataLast);
    } catch (err) {
      console.error("Lỗi load doanh thu thợ:", err);
      setDataLuong([]);
      setDataLuongLastYear([]);
    } finally {
      setLoadingLuong(false);
    }
  }, [branchLuong, filterLuong]);

  // === Fetch Branch Revenue ===
  const fetchBranchRevenue = useCallback(async () => {
    if (!branchChart2) return;
    setLoadingChiNhanh(true);
    try {
      const [dataNow, dataLast] = await Promise.all([
        StatisticsAPI.getMonthlyBranchRevenue({
          year: filterChiNhanh.year, branchId: branchChart2.idBranch,
        }),
        StatisticsAPI.getMonthlyBranchRevenue({
          year: filterChiNhanh.year - 1, branchId: branchChart2.idBranch,
        }),
      ]);
      setDataChiNhanh(dataNow);
      setDataChiNhanhLast(dataLast);
    } catch (err) {
      console.error("Lỗi load doanh thu chi nhánh:", err);
      setDataChiNhanh([]);
      setDataChiNhanhLast([]);
    } finally {
      setLoadingChiNhanh(false);
    }
  }, [branchChart2, filterChiNhanh.year]);

  // === Fetch Ratings ===
  const fetchRatings = useCallback(async () => {
    if (!branchRating) return;
    setLoadingSatisfaction(true);
    try {
      const res = await RatingAPI.getByBranch(branchRating.idBranch);
      setSatisfactionData(
        res.map((b) => ({
          name:         b.user?.fullName || "—",
          score:        parseFloat(b.ratingSummary?.avgRate || 0),
          totalRatings: b.ratingSummary?.totalRate || 0,
        }))
      );
    } catch (err) {
      console.error("Lỗi load đánh giá:", err);
      setSatisfactionData([]);
    } finally {
      setLoadingSatisfaction(false);
    }
  }, [branchRating]);

  // === Fetch AI Summary ===
  const fetchAiSummary = useCallback(async () => {
    if (!branchLuong || !branchRating || !branchChart2) return;
    setLoadingSummary(true);
    setAiSummaries({
      barberRevenue: "AI đang phân tích...",
      branchRevenue: "AI đang phân tích...",
      ratings:       "AI đang phân tích...",
      crossInsight:  "AI đang phân tích...",
    });
    try {
      const res = await SummaryAPI.getSummary({
        branchIdLuong:    branchLuong.idBranch,
        branchNameLuong:  branchLuong.name,
        branchIdRating:   branchRating.idBranch,
        branchNameRating: branchRating.name,
        branchIdChart2:   branchChart2.idBranch,
        branchNameChart2: branchChart2.name,
        yearLuong:        filterLuong.year,
        monthLuong:       filterLuong.month,
        yearChiNhanh:     filterChiNhanh.year,
      });
      setAiSummaries(res);
    } catch (err) {
      console.error("Lỗi AI summary:", err);
      setAiSummaries({
        barberRevenue: "Lỗi khi phân tích. Vui lòng thử lại.",
        branchRevenue: "Lỗi khi phân tích. Vui lòng thử lại.",
        ratings:       "Lỗi khi phân tích. Vui lòng thử lại.",
        crossInsight:  "Lỗi khi phân tích. Vui lòng thử lại.",
      });
    } finally {
      setLoadingSummary(false);
    }
  }, [branchLuong, branchRating, branchChart2, filterLuong, filterChiNhanh.year]);

  const handleFetchAllData = useCallback(() => {
    fetchBarberRevenue();
    fetchBranchRevenue();
    fetchRatings();
    fetchAiSummary();
  }, [fetchBarberRevenue, fetchBranchRevenue, fetchRatings, fetchAiSummary]);

  useEffect(() => {
    if (branchLuong && branchRating && branchChart2) handleFetchAllData();
  }, [handleFetchAllData]);

  // === Merge data biểu đồ 1 ===
  const mergedBarberData = dataLuong.map((d) => {
    const last      = dataLuongLastYear.find((l) => l.barberId === d.barberId);
    const total     = (d.baseSalary||0) + (d.tips||0) + (d.commission||0) + (d.bonus||0);
    const lastTotal = last
      ? (last.baseSalary||0) + (last.tips||0) + (last.commission||0) + (last.bonus||0)
      : 0;
    return {
      ...d,
      shortName:     shortName(d.barberName),
      total,
      lastYearTotal: lastTotal,
      growth:        calcGrowth(total, lastTotal),
    };
  });

  const avgBarberRevenue = mergedBarberData.length
    ? mergedBarberData.reduce((sum, d) => sum + d.total, 0) / mergedBarberData.length
    : 0;

  const chart2Data = buildBranchChartData(dataChiNhanh, dataChiNhanhLast);

  // Label % tăng trưởng — biểu đồ 1
  const GrowthLabel = (props) => {
    const { x, y, width, index } = props;
    const d = mergedBarberData[index];
    if (!d || d.growth === null || d.growth === undefined) return null;
    const isPos = parseFloat(d.growth) >= 0;
    return (
      <text
        x={x + width + 7}
        y={y + 14}
        fill={isPos ? "#1E7F4E" : "#C62828"}
        fontSize={11}
        fontWeight={700}
      >
        {isPos ? "+" : ""}{d.growth}%
      </text>
    );
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className={cx("thongke")}>

      {/* ══════════════════════════════
          BIỂU ĐỒ 1 — Doanh thu theo thợ
      ══════════════════════════════ */}
      <div className={cx("chartBox")}>
        <div className={cx("boxHeader")}>
          <h3 className={cx("chartTitle")}>Doanh thu theo thợ</h3>
          <div className={cx("filterBox")}>
            <select
              value={filterLuong.year}
              onChange={(e) => setFilterLuong({ ...filterLuong, year: parseInt(e.target.value) })}
            >
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={filterLuong.month}
              onChange={(e) => setFilterLuong({ ...filterLuong, month: parseInt(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select
              value={branchLuong?.idBranch || ""}
              onChange={(e) => {
                const s = branchList.find((b) => b.idBranch === parseInt(e.target.value));
                if (s) setBranchLuong(s);
              }}
            >
              {branchList.map((b) => (
                <option key={b.idBranch} value={b.idBranch}>{b.name}</option>
              ))}
            </select>
            <button
              className={cx("update")}
              onClick={handleFetchAllData}
              disabled={loadingLuong || loadingSummary}
            >
              {loadingLuong || loadingSummary ? "Đang tải..." : "Xem & Phân tích"}
            </button>
            <button
              className={cx("excel")}
              onClick={() => exportToExcel(dataLuong, "DoanhThuTheoTho")}
              disabled={loadingLuong}
            >
              Xuất Excel
            </button>
          </div>
        </div>

        <div className={cx("chartContent")}>
          <div className={cx("chartWrapper")}>
            <ResponsiveContainer
              width="100%"
              height={Math.max(360, mergedBarberData.length * 72)}
            >
              <BarChart
                data={mergedBarberData}
                margin={{ top: 20, right: 100, left: 10, bottom: 40 }}
                barCategoryGap="45%"
                maxBarSize={56}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.gridLine} vertical={false} />
                <XAxis
                  dataKey="shortName"
                  interval={0}
                  tick={<CustomXTick />}
                  axisLine={{ stroke: COLOR.gridLine }}
                  tickLine={false}
                />
                <YAxis
                  stroke={COLOR.axisText}
                  tick={{ fontSize: 11, fill: COLOR.axisText }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<BarberTooltip />} cursor={{ fill: "rgba(201,168,76,0.06)" }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 16, color: COLOR.axisText }}
                  iconType="circle"
                  iconSize={8}
                />
                <ReferenceLine
                  y={avgBarberRevenue}
                  stroke={COLOR.gold}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  label={{
                    value: `TB: ${(avgBarberRevenue / 1_000_000).toFixed(1)}M`,
                    position: "insideTopRight",
                    fill: COLOR.gold,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                {/* Stack từ dưới lên: đen → nâu đậm → nâu nhạt → gold */}
                <Bar dataKey="baseSalary" stackId="a" fill="#2C2420"    name="Lương cố định" radius={[0,0,4,4]} />
                <Bar dataKey="tips"       stackId="a" fill="#7B5C52"    name="Tiền tip" />
                <Bar dataKey="commission" stackId="a" fill="#B08878"    name="Hoa hồng" />
                <Bar dataKey="bonus"      stackId="a" fill={COLOR.gold} name="Thưởng" radius={[4,4,0,0]}>
                  <LabelList content={<GrowthLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={cx("aiAnalysis")}>
            <h4>AI Phân tích</h4>
            <p className={cx({ "loading-text": loadingSummary })}>
              {aiSummaries.barberRevenue}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          BIỂU ĐỒ 2 — Doanh thu chi nhánh
      ══════════════════════════════ */}
      <div className={cx("chartBox")}>
        <div className={cx("boxHeader")}>
          <h3 className={cx("chartTitle")}>Doanh thu chi nhánh theo năm</h3>
          <div className={cx("filterBox")}>
            <select
              value={branchChart2?.idBranch || ""}
              onChange={(e) => {
                const s = branchList.find((b) => b.idBranch === parseInt(e.target.value));
                if (s) setBranchChart2(s);
              }}
            >
              {branchList.map((b) => (
                <option key={b.idBranch} value={b.idBranch}>{b.name}</option>
              ))}
            </select>
            <select
              value={filterChiNhanh.year}
              onChange={(e) => setFilterChiNhanh({ year: parseInt(e.target.value) })}
            >
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              className={cx("excel")}
              onClick={() => exportToExcel(chart2Data, `DoanhThu_${branchChart2?.name}`)}
              disabled={loadingChiNhanh}
            >
              Xuất Excel
            </button>
          </div>
        </div>

        <div className={cx("chartContent")}>
          <div className={cx("chartWrapper")}>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={chart2Data} margin={{ top: 16, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.gridLine} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={COLOR.axisText}
                  tick={{ fontSize: 11, fill: COLOR.axisText }}
                  axisLine={{ stroke: COLOR.gridLine }}
                  tickLine={false}
                />
                <YAxis
                  stroke={COLOR.axisText}
                  tick={{ fontSize: 11, fill: COLOR.axisText }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BranchTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 12, color: COLOR.axisText }}
                  formatter={(value) =>
                    value === "namNay"
                      ? `Năm ${filterChiNhanh.year}`
                      : `Năm ${filterChiNhanh.year - 1}`
                  }
                />
                {/* Bar năm nay — teal */}
                <Bar
                  dataKey="namNay"
                  fill={COLOR.teal}
                  name="namNay"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                {/* Line năm ngoái — gold dashed */}
                <Line
                  type="monotone"
                  dataKey="namNgoai"
                  stroke={COLOR.gold}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 3.5, fill: COLOR.gold, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: COLOR.gold }}
                  name="namNgoai"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className={cx("aiAnalysis")}>
            <h4>AI Phân tích</h4>
            <p className={cx({ "loading-text": loadingSummary })}>
              {aiSummaries.branchRevenue}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          BIỂU ĐỒ 3 — Đánh giá thợ
      ══════════════════════════════ */}
      <div className={cx("chartBox")}>
        <div className={cx("boxHeader")}>
          <h3 className={cx("chartTitle")}>Đánh giá thợ từ khách hàng</h3>
          <div className={cx("filterBox")}>
            <select
              value={branchRating?.idBranch || ""}
              onChange={(e) => {
                const s = branchList.find((b) => b.idBranch === parseInt(e.target.value));
                if (s) setBranchRating(s);
              }}
            >
              {branchList.map((b) => (
                <option key={b.idBranch} value={b.idBranch}>{b.name}</option>
              ))}
            </select>
            <button
              className={cx("excel")}
              onClick={() => exportToExcel(satisfactionData, `DanhGia_${branchRating?.name}`)}
              disabled={loadingSatisfaction}
            >
              Xuất Excel
            </button>
          </div>
        </div>

        <div className={cx("chartContent")}>
          <div className={cx("chartWrapper")}>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={satisfactionData}
                margin={{ top: 28, right: 30, left: 10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.gridLine} vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 11, fill: COLOR.axisText }}
                  tickFormatter={shortName}
                  axisLine={{ stroke: COLOR.gridLine }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  stroke={COLOR.axisText}
                  tick={{ fontSize: 11, fill: COLOR.axisText }}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RatingTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: COLOR.axisText }} />
                {/* Ngưỡng 4.0 */}
                <ReferenceLine
                  y={4.0}
                  stroke={COLOR.red}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Ngưỡng 4.0",
                    position: "insideTopRight",
                    fill: COLOR.red,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="score" name="Điểm hài lòng" maxBarSize={52} radius={[6,6,0,0]}>
                  {satisfactionData.map((entry, index) => (
                    <Cell key={index} fill={getRatingColor(entry.score)} />
                  ))}
                  <LabelList
                    dataKey="totalRatings"
                    position="top"
                    formatter={(v) => `${v} lượt`}
                    style={{ fontSize: 10, fill: COLOR.axisText, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={cx("aiAnalysis")}>
            <h4>AI Phân tích</h4>
            <p className={cx({ "loading-text": loadingSatisfaction })}>
              {aiSummaries.ratings}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          CROSS INSIGHT
      ══════════════════════════════ */}
      <div className={cx("chartBox")}>
        <div className={cx("boxHeader")}>
          <h3 className={cx("chartTitle")}>Phân tích tổng hợp</h3>
        </div>
        <div className={cx("aiAnalysis", "crossInsight")}>
          <h4>AI Cross Insight</h4>
          <p className={cx({ "loading-text": loadingSummary })}>
            {aiSummaries.crossInsight}
          </p>
        </div>
      </div>

    </div>
  );
}

export default RevenueTab;
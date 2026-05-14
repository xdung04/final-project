import { useState, useEffect, useMemo } from "react";
import classNames from "classnames/bind";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Users, UserPlus, TrendingUp, DollarSign,
  Send, CheckSquare, Square, AlertTriangle,
  TrendingDown, TrendingUp as TrendingUpIcon,
} from "lucide-react";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import {
  fetchCustomerOverview,
  fetchMonthlyStats,
  fetchCustomerSegments, // sẽ thêm sau
} from "~/services/customerStatsService";
import { fetchAllVouchers, sendRetentionVoucher } from "~/services/voucherService";
import styles from "./CustomerTab.module.scss";

const cx = classNames.bind(styles);

// Cấu hình segment (bỏ walk-in, thêm total active riêng)
const SEGMENT_CONFIG = {
  total:    { label: "Tổng khách", color: "#D4AF37", desc: "Tất cả khách có ít nhất 1 booking", icon: "👥" },
  new:      { label: "Mới",    color: "#4ade80", desc: "Booking đầu tiên trong tháng này", icon: "✨" },
  occasional: { label: "Thỉnh thoảng", color: "#60a5fa", desc: "≥2 booking, tần suất ≥45 ngày/lần", icon: "🔄" },
  regular:  { label: "Thường xuyên", color: "#D4AF37", desc: ">5 booking, tần suất ≤40 ngày/lần", icon: "⭐" },
  inactive: { label: "Không hoạt động", color: "#f43f5e", desc: "≥90 ngày chưa quay lại", icon: "😴" },
};

function formatMoney(val) {
  return Number(val).toLocaleString("vi-VN") + "đ";
}

function StatCard({ icon, title, value, sub, accent }) {
  return (
    <div className={cx("statCard")} style={{ "--accent": accent || "#D4AF37" }}>
      <div className={cx("statIcon")}>{icon}</div>
      <div className={cx("statBody")}>
        <div className={cx("statValue")}>{value}</div>
        <div className={cx("statTitle")}>{title}</div>
        {sub && <div className={cx("statSub")}>{sub}</div>}
      </div>
    </div>
  );
}

// Segment Card cải tiến
function SegmentCard({ segKey, data, totalActive, onClick, active }) {
  const cfg = SEGMENT_CONFIG[segKey];
  const count = data?.count || 0;
  const pct = totalActive > 0 ? ((count / totalActive) * 100).toFixed(0) : 0;
  const change = data?.changePercent || 0;
  const isUp = change >= 0;
  
  // Các chỉ số phụ
  let extra = null;
  if (segKey === "new" && data?.retentionRate !== undefined) {
    extra = <div className={cx("segExtra")}>
      <span>Quay lại: <strong>{data.retentionRate}%</strong></span>
      {data.retentionRateChange && (
        <span className={cx("trend", { up: data.retentionRateChange > 0 })}>
          {data.retentionRateChange > 0 ? <TrendingUpIcon size={12} /> : <TrendingDown size={12} />}
          {Math.abs(data.retentionRateChange)}%
        </span>
      )}
    </div>;
  } else if (segKey === "occasional" && data?.warningCount) {
    extra = <div className={cx("segWarning")}>
      <AlertTriangle size={12} /> {data.warningCount} khách sắp mất
    </div>;
  } else if (segKey === "regular" && data?.revenuePercent !== undefined) {
    extra = <div className={cx("segExtra")}>
      Đóng góp doanh thu: <strong>{data.revenuePercent}%</strong>
    </div>;
  } else if (segKey === "inactive" && data?.pendingVoucherCount !== undefined) {
    extra = <div className={cx("segExtra")}>
      Chưa nhận voucher: <strong>{data.pendingVoucherCount}</strong>
    </div>;
  }

  return (
    <button
      className={cx("segCard", { segActive: active })}
      style={{ "--seg-color": cfg.color, "--seg-bg": `rgba(${parseInt(cfg.color.slice(1,3),16)},${parseInt(cfg.color.slice(3,5),16)},${parseInt(cfg.color.slice(5,7),16)},0.1)` }}
      onClick={onClick}
    >
      <div className={cx("segIcon")}>{cfg.icon}</div>
      <div className={cx("segCount")}>{count}</div>
      <div className={cx("segLabel")}>{cfg.label}</div>
      <div className={cx("segPct")}>{pct}%</div>
      <div className={cx("segBar")}>
        <div className={cx("segBarFill")} style={{ width: `${pct}%`, background: cfg.color }} />
      </div>
      <div className={cx("segChange")}>
        {change !== 0 && (
          <span className={cx("trend", { up: isUp })}>
            {isUp ? <TrendingUpIcon size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {extra && <div className={cx("segFooter")}>{extra}</div>}
      <div className={cx("segDesc")}>{cfg.desc}</div>
    </button>
  );
}

// Custom Tooltip (giữ nguyên)
function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  const returning = payload.find(p => p.dataKey === "returningCustomers");
  const newC = payload.find(p => p.dataKey === "newCustomers");
  const rate = total > 0 ? ((returning?.value / total) * 100).toFixed(1) : 0;
  return (
    <div className={cx("tooltip")}>
      <div className={cx("tt-label")}>{label}</div>
      <div className={cx("tt-row")}>
        <span className={cx("tt-dot")} style={{ background: "#D4AF37" }} />
        <span>Quay lại: <strong>{returning?.value || 0}</strong></span>
      </div>
      <div className={cx("tt-row")}>
        <span className={cx("tt-dot")} style={{ background: "#1A1A1A" }} />
        <span>Khách mới: <strong>{newC?.value || 0}</strong></span>
      </div>
      <div className={cx("tt-divider")} />
      <div className={cx("tt-row")}>
        <span>Tổng: <strong>{total}</strong></span>
        <span className={cx("tt-rate")}>↩ {rate}%</span>
      </div>
    </div>
  );
}

// Segment Table cập nhật thêm cột voucherStatus cho occasional và inactive
function SegmentTable({ customers, segKey, selectedDaysRange, selected, onCheck, onSendSingle, filterStatus, setFilterStatus }) {
  let filteredCustomers = customers;
  if (segKey === "inactive" && selectedDaysRange) {
    filteredCustomers = filteredCustomers.filter(c => c.daysAgo !== null && c.daysAgo >= selectedDaysRange.min && c.daysAgo <= selectedDaysRange.max);
  }
  if ((segKey === "inactive" || segKey === "occasional") && filterStatus !== "all") {
    filteredCustomers = filteredCustomers.filter(c => c.voucherStatus?.type === filterStatus);
  }

  const cols = ["name", "phone", "lastVisit", "bookings", "spend"];
  if (segKey === "inactive" || segKey === "occasional") {
    cols.push("daysAgo");
    cols.push("voucherStatus");
  }
  const hasVoucher = (segKey === "inactive" || segKey === "occasional");

  return (
    <div className={cx("segTable")}>
      {(segKey === "inactive" || segKey === "occasional") && (
        <div className={cx("filterStatusBar")}>
          <label>Trạng thái voucher:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="A">Có voucher hợp lệ</option>
            <option value="B">Đã dùng</option>
            <option value="C">Sẵn sàng nhận</option>
          </select>
        </div>
      )}
      <table className={cx("table")}>
        <thead>
          <tr>
            <th style={{ width: 36 }}></th>
            {cols.includes("name") && <th>Khách hàng</th>}
            {cols.includes("phone") && <th>SĐT</th>}
            {cols.includes("lastVisit") && <th>Lần cuối</th>}
            {cols.includes("daysAgo") && <th>Vắng (ngày)</th>}
            {cols.includes("bookings") && <th>Số lần cắt</th>}
            {cols.includes("spend") && <th>Chi tiêu</th>}
            {cols.includes("voucherStatus") && <th>Trạng thái voucher</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((c) => (
            <tr key={c.id} className={cx("row")}>
              <td>
                {hasVoucher && (
                  <button className={cx("checkbox")} onClick={() => onCheck(c.id)}>
                    {selected.includes(c.id) ? <CheckSquare size={15} color={SEGMENT_CONFIG[segKey]?.color || "#D4AF37"} /> : <Square size={15} color="#ccc" />}
                  </button>
                )}
              </td>
              {cols.includes("name") && (
                <td>
                  <div className={cx("custName")}>{c.name}</div>
                  {c.email && <div className={cx("custEmail")}>{c.email}</div>}
                </td>
              )}
              {cols.includes("phone") && <td>{c.phone || "—"}</td>}
              {cols.includes("lastVisit") && (
                <td>{c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString("vi-VN") : <span className={cx("never")}>Chưa có</span>}</td>
              )}
              {cols.includes("daysAgo") && (
                <td className={cx("daysAgo", { critical: (c.daysAgo || 0) >= 90 })}>{c.daysAgo !== null ? `${c.daysAgo} ngày` : "—"}</td>
              )}
              {cols.includes("bookings") && <td>{c.totalBookings}</td>}
              {cols.includes("spend") && <td className={cx("money")}>{formatMoney(c.totalSpend)}</td>}
              {cols.includes("voucherStatus") && (
                <td className={cx("voucherStatusCell")}>
                  {c.voucherStatus?.type === 'A' && <span className={cx("badge", "badge-gray")}>Có voucher hợp lệ</span>}
                  {c.voucherStatus?.type === 'B' && <span className={cx("badge", "badge-warning")}>Đã dùng {c.voucherStatus.usedCount} lần</span>}
                  {c.voucherStatus?.type === 'C' && <span className={cx("badge", "badge-green")}>Sẵn sàng nhận</span>}
                </td>
              )}
              <td>
                {hasVoucher && (
                  <button className={cx("sendBtn")} onClick={() => onSendSingle(c.id)} disabled={c.voucherStatus?.type === 'A'}>
                    <Send size={11} /> Gửi
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CustomerTab() {
  const { accessToken } = useAuth();
  const { showToast } = useToast();

  const [monthly, setMonthly] = useState([]);
  const [segmentsData, setSegmentsData] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overview, setOverview] = useState(null);

  const [activeSegment, setActiveSegment] = useState("new");
  const [inactiveDaysRange, setInactiveDaysRange] = useState({ min: 30, max: 90 });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // lọc trạng thái voucher cho occasional/inactive

  useEffect(() => {
    loadMonthly();
    loadSegments();
    loadVouchers();
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await fetchCustomerOverview(accessToken);
      setOverview(data);
    } catch { showToast({ text: "Lỗi tải tổng quan", type: "error" }); } finally { setLoadingOverview(false); }
  };
  const loadMonthly = async () => {
    setLoadingMonthly(true);
    try {
      const data = await fetchMonthlyStats(accessToken, 6);
      setMonthly(data);
    } catch { showToast({ text: "Lỗi tải biểu đồ", type: "error" }); } finally { setLoadingMonthly(false); }
  };
  const loadSegments = async () => {
    setLoadingSegments(true);
    try {
      // Gọi API mới getSegmentsMTD
      const data = await fetchCustomerSegments(accessToken);
      setSegmentsData(data);
    } catch { showToast({ text: "Lỗi tải phân loại", type: "error" }); } finally { setLoadingSegments(false); }
  };
  const loadVouchers = async () => {
    try {
      const data = await fetchAllVouchers(accessToken);
      const rv = data.filter(v => v.type === "RETENTION" && v.is_active);
      setVouchers(rv);
      if (rv.length) setSelectedVoucherId(String(rv[0].id));
    } catch {}
  };

  const toggleSelect = (id) => setSelectedCustomers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllCurrent = () => {
    let list = [];
    if (activeSegment === "inactive") {
      list = (segmentsData?.segments?.inactive || []).filter(c => c.daysAgo !== null && c.daysAgo >= inactiveDaysRange.min && c.daysAgo <= inactiveDaysRange.max);
      if (filterStatus !== "all") list = list.filter(c => c.voucherStatus?.type === filterStatus);
    } else if (activeSegment === "occasional") {
      list = (segmentsData?.segments?.occasional || []).filter(c => c.daysAgo !== null && c.daysAgo >= 60); // chỉ khách sắp inactive
      if (filterStatus !== "all") list = list.filter(c => c.voucherStatus?.type === filterStatus);
    }
    setSelectedCustomers(prev => prev.length === list.length ? [] : list.map(c => c.id));
  };
  const doSend = async (ids) => {
    if (!selectedVoucherId || !ids.length) return showToast({ text: "Chọn voucher và ít nhất một khách", type: "error" });
    setSending(true);
    try {
      const res = await sendRetentionVoucher(accessToken, selectedVoucherId, ids);
      showToast({ text: `Đã gửi ${res.totalSent} khách, bỏ qua ${res.totalSkipped} khách`, type: "success", duration: 4000 });
      setSelectedCustomers([]);
      loadSegments(); // refresh để cập nhật trạng thái voucher
    } catch (err) {
      showToast({ text: err.response?.data?.message || "Gửi thất bại", type: "error" });
    } finally { setSending(false); }
  };

  const totalReturning = monthly.reduce((s, m) => s + m.returningCustomers, 0);
  const totalVisitors = monthly.reduce((s, m) => s + m.totalVisitors, 0);
  const avgReturnRate = totalVisitors > 0 ? ((totalReturning / totalVisitors) * 100).toFixed(1) : 0;

  const totalActive = segmentsData?.summary?.totalActive || 0;
  const walkInCount = segmentsData?.summary?.walkInCount || 0;
  // Lấy dữ liệu cho từng segment card từ segmentsData.summary
  const segmentSummaries = {
    total: { count: totalActive, changePercent: 0 }, // changePercent có thể tính từ MTD
    new: segmentsData?.summary?.new || { count: 0, changePercent: 0, retentionRate: 0, retentionRateChange: 0 },
    occasional: segmentsData?.summary?.occasional || { count: 0, changePercent: 0, warningCount: 0 },
    regular: segmentsData?.summary?.regular || { count: 0, changePercent: 0, revenuePercent: 0 },
    inactive: segmentsData?.summary?.inactive || { count: 0, changePercent: 0, pendingVoucherCount: 0 },
  };

  const activeSegData = segmentsData?.segments?.[activeSegment] || [];

  return (
    <div className={cx("wrapper")}>
      {/* 4 stat cards (tổng quan) */}
      <div className={cx("statsRow")}>
        <StatCard icon={<Users size={22} />} title="Tổng khách active" value={totalActive.toLocaleString()} sub={`${walkInCount} khách chưa kích hoạt`} accent="#D4AF37" />
        <StatCard icon={<UserPlus size={22} />} title="Khách mới (tháng)" value={(segmentsData?.summary?.new?.count || 0).toLocaleString()} accent="#4ade80" />
        <StatCard icon={<TrendingUp size={22} />} title="Tỉ lệ quay lại (6T)" value={`${avgReturnRate}%`} sub={`${totalReturning} / ${totalVisitors} lượt`} accent="#60a5fa" />
        <StatCard icon={<DollarSign size={22} />} title="Doanh thu tháng" value={(overview?.totalRevenue || 0).toLocaleString("vi-VN") + "đ"} sub="Tháng hiện tại" accent="#c084fc" />
      </div>

      {/* Biểu đồ */}
      <div className={cx("chartBox")}>
        <div className={cx("chartHeader")}>
          <h3 className={cx("chartTitle")}>Xu hướng 6 tháng gần nhất</h3>
          <div className={cx("insightBadge", "blue")}>↩ TB quay lại: <strong>{avgReturnRate}%</strong></div>
        </div>
        {loadingMonthly ? <div className={cx("loading")}>Đang tải biểu đồ...</div> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => v === "returningCustomers" ? "Quay lại" : "Khách mới"} />
              <Bar dataKey="returningCustomers" stackId="a" fill="#D4AF37" name="returningCustomers" />
              <Bar dataKey="newCustomers" stackId="a" fill="#1A1A1A" radius={[4, 4, 0, 0]} name="newCustomers" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Phân khúc khách hàng */}
      {loadingSegments ? <div className={cx("loading")}>Đang phân tích...</div> : (
        <>
          <div className={cx("segmentsRow")}>
            {Object.keys(SEGMENT_CONFIG).map(key => (
              <SegmentCard
                key={key}
                segKey={key}
                data={segmentSummaries[key]}
                totalActive={totalActive}
                active={activeSegment === key}
                onClick={() => { setActiveSegment(key); setSelectedCustomers([]); setFilterStatus("all"); }}
              />
            ))}
          </div>

          <div className={cx("detailBox")}>
            <div className={cx("detailHeader")}>
              <span className={cx("detailIcon")}>{SEGMENT_CONFIG[activeSegment].icon}</span>
              <strong style={{ color: SEGMENT_CONFIG[activeSegment].color }}>{SEGMENT_CONFIG[activeSegment].label}</strong>
              <span className={cx("detailCount")}> — {activeSegData.length} khách</span>
              <span className={cx("detailDesc")}>{SEGMENT_CONFIG[activeSegment].desc}</span>
            </div>

            {/* Toolbar cho inactive và occasional */}
            {(activeSegment === "inactive" || activeSegment === "occasional") && (
              <div className={cx("inactiveToolbar")}>
                {activeSegment === "inactive" && (
                  <div className={cx("filterRange")}>
                    <label>Khoảng ngày vắng:</label>
                    <input type="number" value={inactiveDaysRange.min} onChange={(e) => setInactiveDaysRange(prev => ({ ...prev, min: Number(e.target.value) }))} min="1" />
                    <span>–</span>
                    <input type="number" value={inactiveDaysRange.max} onChange={(e) => setInactiveDaysRange(prev => ({ ...prev, max: Number(e.target.value) }))} min={inactiveDaysRange.min} />
                    <span>ngày</span>
                  </div>
                )}
                <div className={cx("voucherSelect")}>
                  <label>Voucher gửi:</label>
                  {vouchers.length === 0 ? <span className={cx("noVoucher")}>Chưa có voucher RETENTION active</span> : (
                    <select value={selectedVoucherId} onChange={(e) => setSelectedVoucherId(e.target.value)}>
                      {vouchers.map(v => <option key={v.id} value={v.id}>{v.name} — giảm {v.discount_percent}%{v.valid_days ? `, HH ${v.valid_days} ngày` : ""}</option>)}
                    </select>
                  )}
                </div>
                <button className={cx("selectAllBtn")} onClick={toggleAllCurrent}>
                  {selectedCustomers.length === (() => {
                    let list = [];
                    if (activeSegment === "inactive") list = (segmentsData?.segments?.inactive || []).filter(c => c.daysAgo !== null && c.daysAgo >= inactiveDaysRange.min && c.daysAgo <= inactiveDaysRange.max);
                    if (activeSegment === "occasional") list = (segmentsData?.segments?.occasional || []).filter(c => c.daysAgo !== null && c.daysAgo >= 60);
                    if (filterStatus !== "all") list = list.filter(c => c.voucherStatus?.type === filterStatus);
                    return list.length;
                  })() && (() => {
                    let list = [];
                    if (activeSegment === "inactive") list = (segmentsData?.segments?.inactive || []).filter(c => c.daysAgo !== null && c.daysAgo >= inactiveDaysRange.min && c.daysAgo <= inactiveDaysRange.max);
                    if (activeSegment === "occasional") list = (segmentsData?.segments?.occasional || []).filter(c => c.daysAgo !== null && c.daysAgo >= 60);
                    if (filterStatus !== "all") list = list.filter(c => c.voucherStatus?.type === filterStatus);
                    return list.length;
                  })() ? <CheckSquare size={14} color="#D4AF37" /> : <Square size={14} />}
                  Chọn tất cả
                </button>
                <button className={cx("sendMassBtn")} onClick={() => doSend(selectedCustomers)} disabled={sending || !selectedCustomers.length || !selectedVoucherId}>
                  <Send size={14} /> {sending ? "Đang gửi..." : `Gửi voucher (${selectedCustomers.length})`}
                </button>
              </div>
            )}

            {activeSegData.length === 0 ? <div className={cx("empty")}>Không có khách hàng trong nhóm này</div> : (
              <SegmentTable
                customers={activeSegData}
                segKey={activeSegment}
                selectedDaysRange={activeSegment === "inactive" ? inactiveDaysRange : null}
                selected={selectedCustomers}
                onCheck={toggleSelect}
                onSendSingle={(id) => doSend([id])}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
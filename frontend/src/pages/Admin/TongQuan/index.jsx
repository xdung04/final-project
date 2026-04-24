import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { DollarSign, Users, CalendarDays, Star, Crown, TrendingUp, Scissors, Award } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import styles from "./TongQuan.module.scss";
import { StatisticsAPI } from "~/apis/statisticsAPI";

const cx = classNames.bind(styles);

const COLORS = ["#b8966a", "#2c2c2c", "#d4b896", "#e0d7cc", "#a0856e", "#c4a882"];

const RANK_LABELS = ["rank1", "rank2", "rank3"];

// ─── Tooltip tuỳ chỉnh ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={cx("customTooltip")}>
      <p className={cx("tooltipLabel")}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: "3px 0", fontSize: 13, fontWeight: 600 }}>
          {entry.name}: {Number(entry.value).toLocaleString("vi-VN")} ₫
        </p>
      ))}
    </div>
  );
};

// ─── Skeleton đơn giản ────────────────────────────────────────────────────────
const Skeleton = ({ width = "100%", height = 24, radius = 6 }) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg,#f0ebe3 25%,#e8e0d4 50%,#f0ebe3 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

// ─── Component chính ──────────────────────────────────────────────────────────
function TongQuan() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await StatisticsAPI.getDashboardOverview({ month, year });
        setData(res);
      } catch (err) {
        console.error("Lỗi load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [month, year]);

  const fmt = (val) => (val || 0).toLocaleString("vi-VN") + " ₫";

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const stats = [
    {
      icon: <DollarSign size={24} strokeWidth={1.5} />,
      title: "Doanh Thu Tháng",
      value: loading ? null : fmt(data?.monthlyRevenue),
      trend: "+12.5%",
      isPositive: true,
    },
    {
      icon: <Users size={24} strokeWidth={1.5} />,
      title: "Tổng Khách Phục Vụ",
      value: loading ? null : (data?.servedCustomerCount ?? 0),
      trend: "+5.2%",
      isPositive: true,
    },
    {
      icon: <CalendarDays size={24} strokeWidth={1.5} />,
      title: "Lịch Hẹn Trong Tháng",
      value: loading ? null : (data?.totalBookings ?? 0),
      trend: "-2.1%",
      isPositive: false,
    },
    {
      icon: <Star size={24} strokeWidth={1.5} />,
      title: "Đánh Giá Trung Bình",
      value: loading ? null : (data?.avgRating ?? 0).toFixed(1),
      trend: "Ổn định",
      isPositive: true,
    },
  ];

  // ── Revenue chart lines từ dữ liệu API ────────────────────────────────────
  const branchLines = data?.revenueChart?.branches ?? [];
  const revenueChartData = data?.revenueChart?.weeks ?? [];

  // ── Service distribution ───────────────────────────────────────────────────
  const serviceData = data?.serviceDistribution ?? [];

  // ── Top barbers ────────────────────────────────────────────────────────────
  const topBarbers = data?.topBarbers ?? [];

  // ── Top customers ──────────────────────────────────────────────────────────
  const topCustomers = data?.topCustomers ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cx("dashboardWrapper")}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className={cx("welcomeSection")}>
        <div className={cx("welcomeText")}>
          <h2>Báo cáo tổng quan</h2>
          <p>Cập nhật số liệu kinh doanh mới nhất của hệ thống Barber Lab.</p>
        </div>

        {/* Bộ lọc tháng / năm */}
        <div className={cx("dateFilter")}>
          <CalendarDays size={18} strokeWidth={1.5} />
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={cx("filterSelect")}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={cx("filterSelect")}>
            {[currentYear - 1, currentYear].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────────────────────── */}
      <div className={cx("statsGrid")}>
        {stats.map((s, i) => (
          <div key={i} className={cx("statCard")}>
            <div className={cx("cardHeader")}>
              <div className={cx("iconBox")}>{s.icon}</div>
              <div className={cx("trendBadge", { positive: s.isPositive, negative: !s.isPositive })}>
                <TrendingUp size={14} style={{ transform: s.isPositive ? "none" : "scaleY(-1)" }} />
                <span>{s.trend}</span>
              </div>
            </div>
            <div className={cx("cardBody")}>
              <p className={cx("cardTitle")}>{s.title}</p>
              <h3 className={cx("cardValue")}>{s.value !== null ? s.value : <Skeleton width={120} height={28} />}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ─────────────────────────────────────────────────────────── */}
      <div className={cx("chartsGrid")}>
        {/* Biểu đồ Doanh Thu */}
        <div className={cx("chartCard", "revenueChart")}>
          <div className={cx("sectionHeader")}>
            <div className={cx("titleBox")}>
              <TrendingUp size={20} strokeWidth={1.5} className={cx("sectionIcon")} />
              <h3>Xu Hướng Doanh Thu (30 Ngày)</h3>
            </div>
          </div>

          <div className={cx("chartWrapper")}>
            {loading ? (
              <div style={{ padding: 24 }}>
                <Skeleton height={220} />
              </div>
            ) : revenueChartData.length === 0 ? (
              <p className={cx("noData")}>Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0d7cc" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#999", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#999", fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                  {branchLines.map((br, idx) => (
                    <Line
                      key={br.idBranch}
                      type="monotone"
                      name={br.name}
                      dataKey={br.name}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Biểu đồ Tỉ Trọng Dịch Vụ */}
        <div className={cx("chartCard", "serviceChart")}>
          <div className={cx("sectionHeader")}>
            <div className={cx("titleBox")}>
              <Scissors size={20} strokeWidth={1.5} className={cx("sectionIcon")} />
              <h3>Tỉ Trọng Dịch Vụ</h3>
            </div>
          </div>

          <div className={cx("chartWrapper")}>
            {loading ? (
              <div style={{ padding: 24 }}>
                <Skeleton height={220} />
              </div>
            ) : serviceData.length === 0 ? (
              <p className={cx("noData")}>Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {serviceData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name) => [`${value} lượt`, name]}
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 15px rgba(0,0,0,.1)" }}
                    itemStyle={{ color: "#2c2c2c", fontWeight: 600 }}
                  />
                  <Legend
                    iconType="circle"
                    layout="vertical"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── TABLES ─────────────────────────────────────────────────────────── */}
      <div className={cx("tablesGrid")}>
        {/* Khách Hàng VIP */}
        <div className={cx("tableCard", "topCustomers")}>
          <div className={cx("sectionHeader")}>
            <div className={cx("titleBox")}>
              <Crown size={20} strokeWidth={1.5} className={cx("sectionIcon", "gold")} />
              <h3>Khách Hàng VIP</h3>
            </div>
          </div>

          <div className={cx("tableWrapper")}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={40} />
                ))}
              </div>
            ) : (
              <table className={cx("luxuryTable")}>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th className={cx("textCenter")}>Số lần</th>
                    <th className={cx("textRight")}>Chi tiêu</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length > 0 ? (
                    topCustomers.map((c) => (
                      <tr key={c.idCustomer}>
                        <td>
                          <div className={cx("customerInfo")}>
                            <div className={cx("avatarInitials")}>{(c.fullName || "K").charAt(0).toUpperCase()}</div>
                            <span className={cx("customerName")}>{c.fullName || "Khách ẩn danh"}</span>
                          </div>
                        </td>
                        <td className={cx("textCenter")}>
                          <span className={cx("visitCount")}>{c.visitCount}</span>
                        </td>
                        <td className={cx("textRight")}>
                          <span className={cx("totalSpent")}>{fmt(c.totalSpent)}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Thợ Xuất Sắc Tháng */}
        <div className={cx("tableCard", "topBarbers")}>
          <div className={cx("sectionHeader")}>
            <div className={cx("titleBox")}>
              <Award size={20} strokeWidth={1.5} className={cx("sectionIcon")} />
              <h3>Thợ Xuất Sắc Tháng</h3>
            </div>
          </div>

          <div className={cx("barberList")}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={56} />
                ))}
              </div>
            ) : topBarbers.length > 0 ? (
              topBarbers.map((barber) => (
                <div key={barber.idBarber} className={cx("barberItem")}>
                  <div className={cx("rankBadge", RANK_LABELS[barber.rank - 1] || "")}>{barber.rank}</div>
                  <div className={cx("barberInfo")}>
                    <p className={cx("barberName")}>{barber.name}</p>
                    <span className={cx("barberRole")}>{barber.revenue.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className={cx("barberStats")}>
                    <span className={cx("barberRevenue")}>{fmt(barber.revenue)}</span>
                    <span className={cx("barberRating")}>
                      <Star size={12} fill="#b8966a" color="#b8966a" /> {barber.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TongQuan;

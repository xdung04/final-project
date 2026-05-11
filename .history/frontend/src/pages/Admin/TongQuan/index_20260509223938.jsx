import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import {
  DollarSign, Users, CalendarDays, Star,
  Crown, TrendingUp, Scissors, Award,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import styles from "./TongQuan.module.scss";
import { StatisticsAPI } from "~/apis/statisticsAPI";

const cx = classNames.bind(styles);

// ── Màu biểu đồ (palette NOULE) ───────────────────────────────────────────────
const COLORS = ["#C9A84C", "#2C2720", "#9C8A5A", "#D4C090", "#6B5A38", "#E8D5A3"];

// ── Tooltip tuỳ chỉnh ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={cx("tooltip")}>
      <p className={cx("tooltip__label")}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className={cx("tooltip__item")} style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toLocaleString("vi-VN")} ₫
        </p>
      ))}
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ width = "100%", height = 24, radius = 6 }) => (
  <div
    style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg,#f0ebe3 25%,#e8e0d4 50%,#f0ebe3 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

// ── Label tỉ lệ cho Pie ───────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 600 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Component chính ───────────────────────────────────────────────────────────
function TongQuan() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear  = new Date().getFullYear();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth]     = useState(currentMonth);
  const [year, setYear]       = useState(currentYear);

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

  // ── Stat cards ───────────────────────────────────────────────────────────
  const stats = [
    {
      icon: <DollarSign size={18} strokeWidth={1.5} />,
      label: "Doanh Thu Tháng",
      value: loading ? null : fmt(data?.monthlyRevenue),
      trend: "+12.5%", isPos: true,
    },
    {
      icon: <Users size={18} strokeWidth={1.5} />,
      label: "Khách Phục Vụ",
      value: loading ? null : (data?.servedCustomerCount ?? 0),
      trend: "+5.2%", isPos: true,
    },
    {
      icon: <CalendarDays size={18} strokeWidth={1.5} />,
      label: "Lịch Hẹn Tháng",
      value: loading ? null : (data?.totalBookings ?? 0),
      trend: "-2.1%", isPos: false,
    },
    {
      icon: <Star size={18} strokeWidth={1.5} />,
      label: "Đánh Giá TB",
      value: loading ? null : (data?.avgRating ?? 0).toFixed(1),
      trend: "Ổn định", isPos: null,
    },
  ];

  const branchLines      = data?.revenueChart?.branches ?? [];
  const revenueChartData = data?.revenueChart?.weeks    ?? [];
  const serviceData      = data?.serviceDistribution    ?? [];
  const topBarbers       = data?.topBarbers             ?? [];
  const topCustomers     = data?.topCustomers           ?? [];

  return (
    <div className={cx("dashboardWrapper")}>

      {/* ── PAGE HEADING ──────────────────────────────────────────────────── */}
      <div className={cx("pageHead")}>
        <div>
          <p className={cx("pageHead__eyebrow")}>Nội dung &amp; Số liệu</p>
          <h2 className={cx("pageHead__title")}>
            Tổng quan &amp; <em>Báo cáo</em>
          </h2>
        </div>

        {/* Bộ lọc tháng / năm */}
        <div className={cx("dateFilter")}>
          <CalendarDays size={16} strokeWidth={1.5} />
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className={cx("filterSelect")}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className={cx("filterSelect")}>
            {[currentYear - 1, currentYear].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
      <div className={cx("statsGrid")}>
        {stats.map((s, i) => (
          <div key={i} className={cx("statCard")}>
            <div className={cx("statCard__icon")}>{s.icon}</div>
            <div>
              <div className={cx("statCard__label")}>{s.label}</div>
              <div className={cx("statCard__num")}>
                {s.value !== null ? s.value : <Skeleton width={90} height={22} />}
              </div>
              <div className={cx(
                "statCard__trend",
                s.isPos === true  ? "statCard__trend--pos" :
                s.isPos === false ? "statCard__trend--neg" :
                "statCard__trend--neu"
              )}>
                {s.isPos !== null && (
                  <TrendingUp size={10}
                    style={{ transform: s.isPos ? "none" : "scaleY(-1)" }} />
                )}
                {s.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ────────────────────────────────────────────────────────── */}
      <div className={cx("chartsGrid")}>

        {/* Biểu đồ doanh thu */}
        <div className={cx("sectionCard")}>
          <div className={cx("sectionHead")}>
            <div className={cx("sectionHead__left")}>
              <TrendingUp size={16} strokeWidth={1.5} className={cx("sectionHead__icon")} />
              <span className={cx("sectionHead__title")}>Xu Hướng Doanh Thu (30 Ngày)</span>
            </div>
          </div>

          <div className={cx("chartBody")}>
            {loading ? (
              <Skeleton height={260} radius={8} />
            ) : revenueChartData.length === 0 ? (
              <p className={cx("empty")}>Chưa có dữ liệu</p>
            ) : (
              <div className={cx("revenueChartWrap")}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}
                    margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: "#aaa", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: "#aaa", fontSize: 11 }}
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "#666" }} />
                    {branchLines.map((br, idx) => (
                      <Line key={br.idBranch} type="monotone"
                        name={br.name} dataKey={br.name}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 2 }}
                        activeDot={{ r: 5 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Tỉ trọng dịch vụ */}
        <div className={cx("sectionCard")}>
          <div className={cx("sectionHead")}>
            <div className={cx("sectionHead__left")}>
              <Scissors size={16} strokeWidth={1.5} className={cx("sectionHead__icon")} />
              <span className={cx("sectionHead__title")}>Tỉ Trọng Dịch Vụ</span>
            </div>
          </div>

          <div className={cx("chartBody")}>
            {loading ? (
              <Skeleton height={260} radius={8} />
            ) : serviceData.length === 0 ? (
              <p className={cx("empty")}>Chưa có dữ liệu</p>
            ) : (
              <div className={cx("pieChartWrap")}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={serviceData}
                      cx="50%" cy="42%"
                      innerRadius="38%" outerRadius="60%"
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={renderPieLabel}
                      stroke="none"
                    >
                      {serviceData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value, name) => [`${value} lượt`, name]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid rgba(0,0,0,0.07)",
                        boxShadow: "0 4px 14px rgba(26,22,18,0.08)",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      iconType="circle"
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TABLES ────────────────────────────────────────────────────────── */}
      <div className={cx("tablesGrid")}>

        {/* Khách hàng VIP */}
        <div className={cx("sectionCard")}>
          <div className={cx("sectionHead")}>
            <div className={cx("sectionHead__left")}>
              <Crown size={16} strokeWidth={1.5} className={cx("sectionHead__icon")} />
              <span className={cx("sectionHead__title")}>Khách Hàng VIP</span>
            </div>
          </div>

          <div className={cx("tableWrap")}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px" }}>
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={38} radius={6} />)}
              </div>
            ) : (
              <table className={cx("table")}>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th className={cx("textCenter")}>Lượt</th>
                    <th className={cx("textRight")}>Chi tiêu</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length > 0 ? topCustomers.map((c) => (
                    <tr key={c.idCustomer}>
                      <td>
                        <div className={cx("customerInfo")}>
                          <div className={cx("avatar")}>
                            {(c.fullName || "K").charAt(0).toUpperCase()}
                          </div>
                          {c.fullName || "Khách ẩn danh"}
                        </div>
                      </td>
                      <td className={cx("textCenter")}>
                        <span className={cx("visitCount")}>{c.visitCount}</span>
                      </td>
                      <td className={cx("textRight")}>
                        <span className={cx("totalSpent")}>{fmt(c.totalSpent)}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className={cx("empty")}>Chưa có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Thợ xuất sắc tháng */}
        <div className={cx("sectionCard")}>
          <div className={cx("sectionHead")}>
            <div className={cx("sectionHead__left")}>
              <Award size={16} strokeWidth={1.5} className={cx("sectionHead__icon")} />
              <span className={cx("sectionHead__title")}>Thợ Xuất Sắc Tháng</span>
            </div>
          </div>

          <div className={cx("barberList")}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} height={52} radius={6} />)}
              </div>
            ) : topBarbers.length > 0 ? topBarbers.map((barber) => (
              <div key={barber.idBarber} className={cx("barberItem")}>
                <div className={cx("rankBadge", `rankBadge--${barber.rank}`)}>
                  {barber.rank}
                </div>
                <div className={cx("barberInfo")}>
                  <p className={cx("barberInfo__name")}>{barber.name}</p>
                  <span className={cx("barberInfo__role")}>
                    {barber.bookingCount} lịch hẹn
                  </span>
                </div>
                <div className={cx("barberStats")}>
                  <span className={cx("barberStats__revenue")}>{fmt(barber.revenue)}</span>
                  <span className={cx("barberStats__rating")}>
                    <Star size={10} fill="#C9A84C" color="#C9A84C" />
                    {barber.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            )) : (
              <p className={cx("empty")}>Chưa có dữ liệu</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TongQuan;
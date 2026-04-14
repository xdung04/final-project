import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { 
  DollarSign, Users, CalendarDays, Star, Crown, TrendingUp, Scissors, Award
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import styles from "./TongQuan.module.scss";
import { StatisticsAPI } from "~/apis/statisticsAPI"; 

const cx = classNames.bind(styles);

// --- DỮ LIỆU GIẢ LẬP CHO BIỂU ĐỒ ---
const revenueData = [
  { name: 'Tuần 1', q1: 45000000, q3: 38000000 },
  { name: 'Tuần 2', q1: 52000000, q3: 41000000 },
  { name: 'Tuần 3', q1: 48000000, q3: 45000000 },
  { name: 'Tuần 4', q1: 61000000, q3: 50000000 },
];

const serviceData = [
  { name: 'Uốn Hàn Quốc', value: 40 },
  { name: 'Cắt Layer/Mullet', value: 30 },
  { name: 'Nhuộm Thời Trang', value: 20 },
  { name: 'Gội/Phục Hồi', value: 10 },
];

const topBarbers = [
  { id: 1, name: "Trần Văn Phong", role: "Senior Stylist", revenue: 25000000, rating: 4.9 },
  { id: 2, name: "Lê Hải Hoàng", role: "Master Barber", revenue: 22500000, rating: 4.8 },
  { id: 3, name: "Phạm Tấn Phát", role: "Stylist", revenue: 18000000, rating: 4.7 },
];

const COLORS = ['#b8966a', '#2c2c2c', '#d4b896', '#e0d7cc'];

function TongQuan() {
  const [dashboard, setDashboard] = useState({
    monthlyRevenue: 0,
    servedCustomerCount: 0,
    totalBookings: 0,
    avgRating: 0,
    topCustomers: [],
  });

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString("vi-VN") + " ₫";
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await StatisticsAPI.getDashboardOverview({ month: 10, year: 2025 });
        setDashboard(data);
      } catch (error) {
        console.error("Lỗi khi load dashboard:", error);
      }
    };
    fetchDashboard();
  }, []);

  const stats = [
    { icon: <DollarSign size={24} strokeWidth={1.5} />, title: "Doanh Thu Tháng", value: formatCurrency(dashboard.monthlyRevenue || 185000000), trend: "+12.5%", isPositive: true },
    { icon: <Users size={24} strokeWidth={1.5} />, title: "Tổng Khách Phục Vụ", value: dashboard.servedCustomerCount || 842, trend: "+5.2%", isPositive: true },
    { icon: <CalendarDays size={24} strokeWidth={1.5} />, title: "Lịch Hẹn Trong Tháng", value: dashboard.totalBookings || 915, trend: "-2.1%", isPositive: false },
    { icon: <Star size={24} strokeWidth={1.5} />, title: "Đánh Giá Trung Bình", value: (dashboard.avgRating || 4.8).toFixed(1), trend: "Ổn định", isPositive: true },
  ];

  // Tooltip tùy chỉnh cho biểu đồ để giữ đúng tone màu Luxury
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={cx("customTooltip")}>
          <p className={cx("tooltipLabel")}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: "3px 0", fontSize: "13px", fontWeight: 600 }}>
              {entry.name}: {entry.value.toLocaleString('vi-VN')} ₫
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cx("dashboardWrapper")}>
      
      {/* ====== HEADER ====== */}
      <div className={cx("welcomeSection")}>
        <div className={cx("welcomeText")}>
          <h2>Báo cáo tổng quan</h2>
          <p>Cập nhật số liệu kinh doanh mới nhất của hệ thống Barber Lab.</p>
        </div>
        <div className={cx("dateFilter")}>
          <CalendarDays size={18} strokeWidth={1.5} />
          <span>Tháng 10, 2025</span>
        </div>
      </div>

      {/* ====== THỐNG KÊ NHANH ====== */}
      <div className={cx("statsGrid")}>
        {stats.map((s, i) => (
          <div key={i} className={cx("statCard")}>
            <div className={cx("cardHeader")}>
              <div className={cx("iconBox")}>{s.icon}</div>
              <div className={cx("trendBadge", { positive: s.isPositive, negative: !s.isPositive })}>
                {s.isPositive ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{transform: "scaleY(-1)"}} />}
                <span>{s.trend}</span>
              </div>
            </div>
            <div className={cx("cardBody")}>
              <p className={cx("cardTitle")}>{s.title}</p>
              <h3 className={cx("cardValue")}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ====== KHU VỰC BIỂU ĐỒ ====== */}
      <div className={cx("chartsGrid")}>
        
        {/* Biểu đồ Doanh Thu Line Chart */}
        <div className={cx("chartCard", "revenueChart")}>
          <div className={cx("sectionHeader")}>
            <div className={cx("titleBox")}>
              <TrendingUp size={20} strokeWidth={1.5} className={cx("sectionIcon")} />
              <h3>Xu Hướng Doanh Thu (30 Ngày)</h3>
            </div>
          </div>
          <div className={cx("chartWrapper")}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0d7cc" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} tickFormatter={(val) => `${val / 1000000}M`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}/>
                <Line type="monotone" name="Chi nhánh Quận 1" dataKey="q1" stroke="#b8966a" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                <Line type="monotone" name="Chi nhánh Quận 3" dataKey="q3" stroke="#2c2c2c" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ Xu hướng Dịch Vụ Donut Chart */}
        <div className={cx("chartCard", "serviceChart")}>
          <div className={cx("sectionHeader")}>
            <div className={cx("titleBox")}>
              <Scissors size={20} strokeWidth={1.5} className={cx("sectionIcon")} />
              <h3>Tỉ Trọng Dịch Vụ</h3>
            </div>
          </div>
          <div className={cx("chartWrapper")}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={serviceData} cx="50%" cy="45%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#2c2c2c', fontWeight: 600 }} />
                <Legend iconType="circle" layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '13px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ====== KHU VỰC BẢNG DỮ LIỆU ====== */}
      <div className={cx("tablesGrid")}>
        
        {/* Top Khách Hàng VIP */}
        <div className={cx("tableCard", "topCustomers")}>
          <div className={cx("sectionHeader")}>
            <div className={cx("titleBox")}>
              <Crown size={20} strokeWidth={1.5} className={cx("sectionIcon", "gold")} />
              <h3>Khách Hàng VIP</h3>
            </div>
            <button className={cx("actionBtn")}>Xem tất cả</button>
          </div>
          <div className={cx("tableWrapper")}>
            <table className={cx("luxuryTable")}>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th className={cx("textCenter")}>Số lần</th>
                  <th className={cx("textRight")}>Chi tiêu</th>
                </tr>
              </thead>
              <tbody>
                {/* Giả lập data nếu API rỗng */}
                {(dashboard.topCustomers?.length > 0 ? dashboard.topCustomers : [
                  { idCustomer: 1, fullName: "Lý Tuấn Kiệt", visitCount: 8, totalSpent: 4500000 },
                  { idCustomer: 2, fullName: "Hoàng Gia Bảo", visitCount: 6, totalSpent: 3200000 },
                  { idCustomer: 3, fullName: "Đinh Công Thành", visitCount: 5, totalSpent: 2800000 },
                ]).map((c) => (
                  <tr key={c.idCustomer}>
                    <td>
                      <div className={cx("customerInfo")}>
                        <div className={cx("avatarInitials")}>
                          {c.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className={cx("customerName")}>{c.fullName}</span>
                      </div>
                    </td>
                    <td className={cx("textCenter")}>
                      <span className={cx("visitCount")}>{c.visitCount}</span>
                    </td>
                    <td className={cx("textRight")}>
                      <span className={cx("totalSpent")}>{formatCurrency(c.totalSpent)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Barbers (Thay thế Recent Activity) */}
        <div className={cx("tableCard", "topBarbers")}>
          <div className={cx("sectionHeader")}>
            <div className={cx("titleBox")}>
              <Award size={20} strokeWidth={1.5} className={cx("sectionIcon")} />
              <h3>Thợ Xuất Sắc Tháng</h3>
            </div>
          </div>
          <div className={cx("barberList")}>
            {topBarbers.map((barber, index) => (
              <div key={barber.id} className={cx("barberItem")}>
                <div className={cx("rankBadge", { rank1: index === 0, rank2: index === 1, rank3: index === 2 })}>
                  {index + 1}
                </div>
                <div className={cx("barberInfo")}>
                  <p className={cx("barberName")}>{barber.name}</p>
                  <span className={cx("barberRole")}>{barber.role}</span>
                </div>
                <div className={cx("barberStats")}>
                  <span className={cx("barberRevenue")}>{formatCurrency(barber.revenue)}</span>
                  <span className={cx("barberRating")}><Star size={12} fill="#b8966a" color="#b8966a"/> {barber.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default TongQuan;
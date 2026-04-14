import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./ThoCatToc.module.scss";

// Lucide Icons thay cho Emojis
import { 
  Calendar, 
  User, 
  MonitorPlay, 
  ShoppingBag, 
  Award, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  Scissors
} from "lucide-react";

import StatCard from "~/components/StatCard";
import LichHen from "./LichHen";
import HoSoCaNhan from "./HoSoCaNhan";
import VideoTayNghe from "./VideoTayNghe";
import SanPham from "./SanPham";
import Thuong from "./Thuong";

import { fetchBarberDashboardStats } from "~/services/barberService";
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const formatCurrency = (num) => {
    const value = parseFloat(num);
    if (isNaN(value)) return "0đ";
    return Math.round(value).toLocaleString("vi-VN") + "đ";
};

// Cấu hình menu dùng icon từ Lucide
const menuItems = [
    { id: "lichhen", label: "Lịch hẹn hôm nay", path: "/tho-cat-toc", icon: <Calendar size={20} strokeWidth={1.8} /> },
    { id: "hoso", label: "Hồ sơ cá nhân", path: "/tho-cat-toc/profile", icon: <User size={20} strokeWidth={1.8} /> },
    { id: "video", label: "Video tay nghề", path: "/tho-cat-toc/videos", icon: <MonitorPlay size={20} strokeWidth={1.8} /> },
    { id: "sanpham", label: "Sản phẩm", path: "/tho-cat-toc/products", icon: <ShoppingBag size={20} strokeWidth={1.8} /> },
    { id: "thuong", label: "Thưởng", path: "/tho-cat-toc/rewards", icon: <Award size={20} strokeWidth={1.8} /> },
];

function ThoCatToc() {
    const { user, accessToken, loading: isAuthLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const idBarber = user?.idUser;
    const barberName = user?.fullName || "Quý khách";
    const avatarLetter = barberName.charAt(0).toUpperCase();

    // Tìm tab đang active dựa trên URL hiện tại
    const currentMenuItem = menuItems.find(item => item.path === location.pathname) || menuItems[0];
    const activeId = currentMenuItem.id;

    const handleMenuClick = (path) => {
        navigate(path);
    };

    useEffect(() => {
        if (isAuthLoading || !idBarber || !accessToken) {
            if (!isAuthLoading) setLoadingStats(false);
            return;
        }

        const loadStats = async () => {
            setLoadingStats(true);
            try {
                const data = await fetchBarberDashboardStats(idBarber, accessToken);
                setStats(data);
            } catch (error) {
                console.error("Lỗi tải stats dashboard:", error);
                setStats(null);
            } finally {
                setLoadingStats(false);
            }
        };

        loadStats();
    }, [idBarber, accessToken, isAuthLoading]);

    if (isAuthLoading || loadingStats) {
        return (
            <div className={cx("loadingWrapper")}>
                <div className={cx("loader")}></div>
                <p>Đang chuẩn bị không gian làm việc...</p>
            </div>
        );
    }

    return (
        <div className={cx("barberLayout")}>
            {/* ====== SIDEBAR ====== */}
            <aside className={cx("sidebar", { collapsed: sidebarCollapsed })}>
                <div className={cx("sidebarHeader")}>
                    <div className={cx("logoWrapper")}>
                        <Scissors size={24} className={cx("logoIcon")} />
                    </div>
                    {!sidebarCollapsed && (
                        <div className={cx("sidebarBrand")}>
                            <h2 className={cx("brandTitle")}>BarberSpace</h2>
                            <span className={cx("brandSubtitle")}>Stylist Portal</span>
                        </div>
                    )}
                </div>

                <nav className={cx("sidebarNav")}>
                    <div className={cx("navGroup")}>
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleMenuClick(item.path)}
                                className={cx("navItem", { active: activeId === item.id })}
                                title={sidebarCollapsed ? item.label : ""}
                            >
                                <span className={cx("navIcon")}>{item.icon}</span>
                                {!sidebarCollapsed && (
                                    <span className={cx("navLabel")}>{item.label}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={cx("collapseToggle")}
                >
                    {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </aside>

            {/* ====== MAIN CONTENT ====== */}
            <div className={cx("mainContent")}>
                {/* Top Header */}
                <header className={cx("topHeader")}>
                    <div className={cx("headerLeft")}>
                        <h1 className={cx("pageTitle")}>{currentMenuItem.label}</h1>
                        <div className={cx("breadcrumb")}>
                            <span>Workspace</span>
                            <span className={cx("separator")}>/</span>
                            <span className={cx("current")}>{currentMenuItem.label}</span>
                        </div>
                    </div>
                    
                    <div className={cx("headerRight")}>
                        <button className={cx("iconBtn")}>
                            <Bell size={20} strokeWidth={1.8} />
                            <span className={cx("badge")}></span>
                        </button>
                        <div className={cx("divider")}></div>
                        <div className={cx("userInfo")}>
                            <div className={cx("userText")}>
                                <span className={cx("greeting")}>Chào ngày mới,</span>
                                <strong className={cx("name")}>{barberName}</strong>
                            </div>
                            <div className={cx("avatar")}>
                                {avatarLetter}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className={cx("contentArea")}>
                    {/* Stats */}
                    <div className={cx("statsGrid")}>
                        <StatCard
                            title="Lịch hẹn tuần này"
                            value={stats?.totalAppointmentsThisWeek?.toLocaleString("vi-VN") || "0"}
                            desc="Pending + Completed"
                            // Bạn có thể update Component StatCard để nhận icon prop nếu muốn
                        />
                        <StatCard
                            title="Lượt xem Reels"
                            value={stats?.totalReelViews?.toLocaleString("vi-VN") || "0"}
                            desc="Tổng lượt tương tác"
                        />
                        <StatCard
                            title="Doanh thu tháng"
                            value={formatCurrency(stats?.monthlyRevenue)}
                            desc="Bao gồm tiền tip"
                        />
                        <StatCard
                            title="Đánh giá trung bình"
                            value={stats?.avgRating ? Number(stats.avgRating).toFixed(1) : "0.0"}
                            desc="Từ khách hàng"
                        />
                    </div>

                    {/* Nội dung thay đổi theo Tab (URL) */}
                    <div className={cx("tabContainer")}>
                        {activeId === "lichhen" && <LichHen />}
                        {activeId === "hoso" && <HoSoCaNhan />}
                        {activeId === "video" && <VideoTayNghe />}
                        {activeId === "sanpham" && <SanPham />}
                        {activeId === "thuong" && <Thuong />}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ThoCatToc;
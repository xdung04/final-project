import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./ThoCatToc.module.scss";

// Lucide Icons
import { 
  Calendar, 
  User, 
  MonitorPlay, 
  ShoppingBag, 
  Award, 
  Wallet, 
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
import ThuNhap from "./ThuNhap"; 

import { fetchBarberDashboardStats } from "~/services/barberService";
import { fetchMyNotifications, markNotificationAsRead } from "~/services/notificationService"; // Import API Thông báo
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const formatCurrency = (num) => {
    const value = parseFloat(num);
    if (isNaN(value)) return "0đ";
    return Math.round(value).toLocaleString("vi-VN") + "đ";
};

const menuItems = [
    { id: "lichhen", label: "Lịch hẹn hôm nay", path: "/tho-cat-toc", icon: <Calendar size={20} strokeWidth={1.8} /> },
    { id: "hoso", label: "Hồ sơ cá nhân", path: "/tho-cat-toc/profile", icon: <User size={20} strokeWidth={1.8} /> },
    { id: "video", label: "Video tay nghề", path: "/tho-cat-toc/videos", icon: <MonitorPlay size={20} strokeWidth={1.8} /> },
    { id: "sanpham", label: "Sản phẩm", path: "/tho-cat-toc/products", icon: <ShoppingBag size={20} strokeWidth={1.8} /> },
    { id: "thuong", label: "Thưởng", path: "/tho-cat-toc/rewards", icon: <Award size={20} strokeWidth={1.8} /> },
    { id: "thunhap", label: "Thu nhập", path: "/tho-cat-toc/income", icon: <Wallet size={20} strokeWidth={1.8} /> },
];

function ThoCatToc() {
    const { user, accessToken, loading: isAuthLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // States cho Stats
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // States cho Notifications
    const [showNotify, setShowNotify] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedNotification, setSelectedNotification] = useState(null);

    // Refs cho Notifications popup outside click
    const notifyRef = useRef(null);
    const dialogRef = useRef(null);

    const idBarber = user?.idUser;
    const barberName = user?.fullName || "Barber";
    const avatarLetter = barberName.charAt(0).toUpperCase();

    const currentMenuItem = menuItems.find(item => item.path === location.pathname) || menuItems[0];
    const activeId = currentMenuItem.id;

    const handleMenuClick = (path) => {
        navigate(path);
    };

    // 1. Fetch Stats & Notifications song song
    useEffect(() => {
        if (isAuthLoading || !idBarber || !accessToken) {
            if (!isAuthLoading) setLoadingStats(false);
            return;
        }

        const loadData = async () => {
            setLoadingStats(true);
            try {
                // Chạy đồng thời 2 API để load nhanh hơn
                const [statsData, notifyData] = await Promise.all([
                    fetchBarberDashboardStats(idBarber, accessToken),
                    fetchMyNotifications(accessToken)
                ]);
                
                setStats(statsData);
                
                // Set data cho notifications
                if (notifyData) {
                    setUnreadCount(notifyData.unreadCount || 0);
                    setNotifications(notifyData.notifications || []);
                }
            } catch (error) {
                console.error("Lỗi tải data dashboard:", error);
                setStats(null);
            } finally {
                setLoadingStats(false);
            }
        };

        loadData();
    }, [idBarber, accessToken, isAuthLoading]);

    // 2. Click outside để đóng dropdown thông báo
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                notifyRef.current &&
                !notifyRef.current.contains(event.target) &&
                (!dialogRef.current || !dialogRef.current.contains(event.target))
            ) {
                setShowNotify(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. Xử lý khi click vào 1 thông báo cụ thể
    const handleNotificationClick = async (noti) => {
        setSelectedNotification(noti);
        if (!noti.isRead && accessToken) {
            const success = await markNotificationAsRead(noti.idNotification, accessToken);
            if (success) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.idNotification === noti.idNotification ? { ...n, isRead: true } : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }
    };

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
                        
                        {/* === THÔNG BÁO WRAPPER === */}
                        <div className={cx("notificationWrapper")} ref={notifyRef}>
                            <button 
                                className={cx("iconBtn", "bellTrigger")}
                                onClick={() => setShowNotify((prev) => !prev)}
                            >
                                <Bell size={20} strokeWidth={1.8} />
                                {unreadCount > 0 && (
                                    <span className={cx("badge")}>
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown danh sách thông báo */}
                            {showNotify && (
                                <div className={cx("notifyDropdown")}>
                                    <div className={cx("notifyHeader")}>Thông báo của bạn</div>
                                    <div className={cx("notifyList")}>
                                        {notifications.length === 0 ? (
                                            <div className={cx("notifyItem")}>Không có thông báo mới</div>
                                        ) : (
                                            notifications.map((noti) => (
                                                <div
                                                    key={noti.idNotification}
                                                    className={cx("notifyItem", { unread: !noti.isRead })}
                                                    onClick={() => handleNotificationClick(noti)}
                                                >
                                                    <p className={cx("notifyTitle")}>{noti.title}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

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
                    <div className={cx("statsGrid")}>
                        <StatCard
                            title="Lịch hẹn tuần này"
                            value={stats?.totalAppointmentsThisWeek?.toLocaleString("vi-VN") || "0"}
                            desc="Pending + Completed"
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

                    <div className={cx("tabContainer")}>
                        {activeId === "lichhen" && <LichHen />}
                        {activeId === "hoso" && <HoSoCaNhan />}
                        {activeId === "video" && <VideoTayNghe />}
                        {activeId === "sanpham" && <SanPham />}
                        {activeId === "thuong" && <Thuong />}
                        {activeId === "thunhap" && <ThuNhap />}
                    </div>
                </main>
            </div>

            {/* === DIALOG HIỂN THỊ CHI TIẾT THÔNG BÁO === */}
            {selectedNotification && (
                <div className={cx("customDialogOverlay")} onClick={() => setSelectedNotification(null)}>
                    <div ref={dialogRef} className={cx("customDialog")} onClick={(e) => e.stopPropagation()}>
                        <h3 className={cx("dialogTitle")}>{selectedNotification.title}</h3>
                        {selectedNotification.content ? (
                            <p className={cx("dialogContent")}>{selectedNotification.content}</p>
                        ) : (
                            <p className={cx("dialogContent", "noContent")}>Không có nội dung chi tiết.</p>
                        )}
                        <button className={cx("dialogCloseBtn")} onClick={() => setSelectedNotification(null)}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ThoCatToc;
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Store, 
  Scissors, 
  Users, 
  Ticket, 
  Wallet, 
  Award,
  Briefcase,
  Bell,
  Search,
  Newspaper,
  Wand2,
  Clock,
  CheckCheck,
  CalendarCheck,
  DollarSign,
  Megaphone,
  Inbox
} from "lucide-react";

import styles from "./Admin.module.scss";
import ThongKe from "./ThongKe";
import ThoCatToc from "./ThoCatToc";
import Voucher from "./Voucher";
import LuongThuong from "./LuongThuong";
import QuanLyDiem from "./QuanLyDiem";
import TongQuan from "./TongQuan"; 
import ChiNhanh from "./ChiNhanh";
import DichVu from "./DichVu";
import ChinhSach from "./ChinhSach";
import TinTuc from "./TinTuc";
import KieuToc from "./KieuToc";

import { fetchMyNotifications, markNotificationAsRead } from "~/services/notificationService";
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const menuItems = [
  { id: "tongquan", label: "Tổng Quan", path: "/admin", icon: <LayoutDashboard size={20} strokeWidth={1.5} />, category: "dashboard" },
  { id: "thongke", label: "Thống Kê", path: "/admin/statics", icon: <TrendingUp size={20} strokeWidth={1.5} />, category: "dashboard" },
  { id: "chinhanh", label: "Chi Nhánh", path: "/admin/branches", icon: <Store size={20} strokeWidth={1.5} />, category: "management" },
  { id: "dichvu", label: "Dịch Vụ", path: "/admin/services", icon: <Scissors size={20} strokeWidth={1.5} />, category: "management" },
  { id: "tho", label: "Thợ Cắt Tóc", path: "/admin/barbers", icon: <Users size={20} strokeWidth={1.5} />, category: "management" },
  { id: "voucher", label: "Voucher", path: "/admin/vouchers", icon: <Ticket size={20} strokeWidth={1.5} />, category: "finance" },
  { id: "luong", label: "Lương Thưởng", path: "/admin/payroll", icon: <Wallet size={20} strokeWidth={1.5} />, category: "finance" },
  { id: "hr-policy", label: "Chính Sách Thợ", path: "/admin/hr-policy", icon: <Briefcase size={20} strokeWidth={1.5} />, category: "finance" },
  { id: "loyalty", label: "Điểm Khách Hàng", path: "/admin/loyalty", icon: <Award size={20} strokeWidth={1.5} />, category: "management" },
  { id: "hairStyle", label: "Kiểu Tóc", path: "/admin/hair-style", icon: <Wand2 size={20} strokeWidth={1.5} />, category: "management" },
  { id: "tintuc", label: "Tin Tức", path: "/admin/news", icon: <Newspaper size={20} strokeWidth={1.5} />, category: "management" },
];

// ─── Helpers ────────────────────────────────────────────────────────
const NOTI_ICONS = {
  BOOKING: <CalendarCheck size={14} />,
  SALARY:  <DollarSign size={14} />,
  SYSTEM:  <Megaphone size={14} />,
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function Admin() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const notifyRef = useRef(null);
  const dialogRef = useRef(null);

  const menuCategories = useMemo(() => {
    const categories = {
      dashboard: { label: "Dashboard", items: [] },
      management: { label: "Quản Lý", items: [] },
      finance: { label: "Tài Chính", items: [] }
    };
    menuItems.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].items.push(item);
      }
    });
    return categories;
  }, []);

  const currentMenuItem = useMemo(() => {
    return menuItems.find(item => item.path === location.pathname) || menuItems[0];
  }, [location.pathname]);

  const activeId = currentMenuItem.id;

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const notifyData = await fetchMyNotifications();
        if (notifyData && isMounted) {
          setUnreadCount(notifyData.unreadCount || 0);
          setNotifications(notifyData.notifications || []);
        }
      } catch (error) {
        console.error("Lỗi tải thông báo:", error);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifyRef.current && !notifyRef.current.contains(event.target) && 
          (!dialogRef.current || !dialogRef.current.contains(event.target))) {
        setShowNotify(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (noti) => {
    setSelectedNotification(noti);
    if (!noti.isRead) {
      const success = await markNotificationAsRead(noti.idNotification);
      if (success) {
        setNotifications(prev => prev.map(n => n.idNotification === noti.idNotification ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleMarkRead = async (e, noti) => {
    e.stopPropagation();
    if (!noti.isRead) {
      const success = await markNotificationAsRead(noti.idNotification);
      if (success) {
        setNotifications(prev => prev.map(n => n.idNotification === noti.idNotification ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <div className={cx("adminLayout")}>
      {/* SIDEBAR */}
      <aside className={cx("sidebar", { collapsed: sidebarCollapsed })}>
        <div className={cx("sidebarHeader")}>
          <div className={cx("sidebarLogo")}>
             <Scissors size={20} />
          </div>
          {!sidebarCollapsed && (
            <div className={cx("sidebarBrand")}>
              <h2 className={cx("brandTitle")}>Barber Lab</h2>
              <span className={cx("brandSubtitle")}>Admin Panel</span>
            </div>
          )}
        </div>

        <nav className={cx("sidebarNav")}>
          {Object.entries(menuCategories).map(([key, category]) => {
            if (category.items.length === 0) return null;
            return (
              <div key={key} className={cx("navGroup")}>
                {!sidebarCollapsed && <div className={cx("navGroupLabel")}>{category.label}</div>}
                {category.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={cx("navItem", { active: activeId === item.id })}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <span className={cx("navIcon")}>{item.icon}</span>
                    {!sidebarCollapsed && <span className={cx("navLabel")}>{item.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={cx("collapseToggle")}>
          <span className={cx("toggleIcon")}>{sidebarCollapsed ? "→" : "←"}</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className={cx("mainContent")}>
        <header className={cx("topHeader")}>
          <div className={cx("headerLeft")}>
            <h1 className={cx("pageTitle")}>{currentMenuItem.label}</h1>
            <div className={cx("breadcrumb")}>
              <span>Admin</span>
              <span className={cx("separator")}>/</span>
              <span className={cx("current")}>{currentMenuItem.label}</span>
            </div>
          </div>

          <div className={cx("headerRight")}>
            <button className={cx("iconBtn")}>
              <Search size={18} strokeWidth={1.5} />
            </button>

            <div className={cx("notificationWrapper")} ref={notifyRef}>
              <button className={cx("iconBtn", "bellTrigger")} onClick={() => setShowNotify(!showNotify)}>
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && <span className={cx("badge")}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </button>

              {showNotify && (
                <div className={cx("notifyDropdown")}>
                  <div className={cx("notifyHeader")}>
                    <span>Thông báo</span>
                    {unreadCount > 0 && <span className={cx("notifyHeaderBadge")}>{unreadCount} mới</span>}
                  </div>
                  <div className={cx("notifyList")}>
                    {notifications.length === 0 ? (
                      <div className={cx("notifyEmpty")}>
                        <Inbox size={32} />
                        <p>Không có thông báo</p>
                      </div>
                    ) : (
                      notifications.map(noti => {
                        const type = noti.type || "SYSTEM";
                        return (
                          <div key={noti.idNotification} className={cx("notifyItem", { unread: !noti.isRead })} onClick={() => handleNotificationClick(noti)}>
                            <span className={cx("notifyIcon", type.toLowerCase())}>
                              {NOTI_ICONS[type] || NOTI_ICONS.SYSTEM}
                            </span>
                            <div className={cx("notifyBody")}>
                              <p className={cx("notifyTitle")}>{noti.title}</p>
                              <span className={cx("notifyTime")}>
                                <Clock size={10} /> {formatTimeAgo(noti.createdAt)}
                              </span>
                            </div>
                            {!noti.isRead && (
                              <button className={cx("notifyMarkBtn")} onClick={(e) => handleMarkRead(e, noti)} title="Đánh dấu đã đọc">
                                <CheckCheck size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={cx("divider")}></div>
            <div className={cx("adminInfo")}>
               <div className={cx("adminAvatar")}>A</div>
               {!sidebarCollapsed && <span className={cx("adminName")}>{user?.fullName || "Quản trị viên"}</span>}
            </div>
          </div>
        </header>

        <main className={cx("contentArea")}>
          {activeId === "tongquan" && <TongQuan />}
          {activeId === "thongke" && <ThongKe />}
          {activeId === "chinhanh" && <ChiNhanh />}
          {activeId === "dichvu" && <DichVu />}
          {activeId === "tho" && <ThoCatToc />}
          {activeId === "voucher" && <Voucher />}
          {activeId === "luong" && <LuongThuong />}
          {activeId === "hr-policy" && <ChinhSach />}
          {activeId === "loyalty" && <QuanLyDiem />}
          {activeId === "tintuc" && <TinTuc />}
          {activeId === "hairStyle" && <KieuToc />}
        </main>
      </div>

      {/* NOTIFICATION DIALOG */}
      {selectedNotification && (
        <div className={cx("customDialogOverlay")} onClick={() => setSelectedNotification(null)}>
          <div ref={dialogRef} className={cx("customDialog")} onClick={e => e.stopPropagation()}>
            <div className={cx("dialogTypeBadge")}>
              {NOTI_ICONS[selectedNotification.type] || NOTI_ICONS.SYSTEM}
              <span>{selectedNotification.type || "HỆ THỐNG"}</span>
            </div>
            <h3 className={cx("dialogTitle")}>{selectedNotification.title}</h3>
            <p className={cx("dialogContent")}>{selectedNotification.content || "Không có nội dung chi tiết."}</p>
            <button className={cx("dialogCloseBtn")} onClick={() => setSelectedNotification(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
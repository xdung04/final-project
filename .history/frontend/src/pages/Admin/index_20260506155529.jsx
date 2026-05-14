import React, { useState, useEffect, useRef } from "react"; // Thêm useEffect, useRef
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
  Bell,      // Thêm icon Bell
  Search     // Thêm icon Search cho đồng bộ
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

// Import services và context
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
  { id: "loyalty", label: "Điểm Khách Hàng", path: "/admin/loyalty", icon: <Award size={20} strokeWidth={1.5} />, category: "management" }
];

const menuCategories = {
  dashboard: { label: "Dashboard", items: [] },
  management: { label: "Quản Lý", items: [] },
  finance: { label: "Tài Chính", items: [] }
};

// Reset và phân loại menu
Object.keys(menuCategories).forEach(key => menuCategories[key].items = []);
menuItems.forEach(item => {
  if (menuCategories[item.category]) {
    menuCategories[item.category].items.push(item);
  }
});

function Admin() {
  const { accessToken } = useAuth(); // Lấy token từ AuthContext
  const location = useLocation();
  const navigate = useNavigate();
  
  // State quản lý UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // State quản lý thông báo
  const [showNotify, setShowNotify] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const notifyRef = useRef(null);
  const dialogRef = useRef(null);

  const currentMenuItem = menuItems.find(item => item.path === location.pathname) || menuItems[0];
  const activeId = currentMenuItem.id;

  // 1. Fetch thông báo khi component mount
  useEffect(() => {
    if (!accessToken) return;

    const loadNotifications = async () => {
      try {
        const data = await fetchMyNotifications(accessToken);
        if (data) {
          setUnreadCount(data.unreadCount || 0);
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Lỗi tải thông báo Admin:", error);
      }
    };

    loadNotifications();
    // Có thể thiết lập interval để fetch thông báo mới mỗi 5 phút
    // const interval = setInterval(loadNotifications, 300000);
    // return () => clearInterval(interval);
  }, [accessToken]);

  // 2. Xử lý click ngoài để đóng dropdown
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

  // 3. Xử lý khi click vào một thông báo
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

  return (
    <div className={cx("adminLayout")}>
      <aside className={cx("sidebar", { collapsed: sidebarCollapsed })}>
        <div className={cx("sidebarHeader")}>
          <img src="/keo.png" alt="Logo" className={cx("sidebarLogo")} />
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

          <div className={cx("headerRight")} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className={cx("iconBtn")}>
                <Search size={18} strokeWidth={1.5} />
            </button>

            {/* === THÔNG BÁO WRAPPER === */}
            <div className={cx("notificationWrapper")} ref={notifyRef} style={{ position: 'relative' }}>
                <button 
                    className={cx("iconBtn", "bellTrigger")}
                    onClick={() => setShowNotify((prev) => !prev)}
                >
                    <Bell size={18} strokeWidth={1.5} />
                    {unreadCount > 0 && (
                        <span className={cx("badge")}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </button>

                {showNotify && (
                    <div className={cx("notifyDropdown")}>
                        <div className={cx("notifyHeader")}>Thông báo hệ thống</div>
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
                                        <span className={cx("notifyDot")}></span>
                                        <p className={cx("notifyTitle")}>{noti.title}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className={cx("divider")}></div>
            <div className={cx("adminInfo")} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={cx("avatar")} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
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

export default Admin;
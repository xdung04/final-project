import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import {
  LayoutDashboard, MessageSquare, History,
  Bell, LogOut, MapPin, X,
} from "lucide-react";

import styles from "./Receptionist.module.scss";
import DatLichThanhToan from "./DatLichThanhToan";
import ChatKhachHang    from "./ChatKhachHang";
import LichSuGiaoDich   from "./LichSuGiaoDich";

import { fetchMyBranch }                                 from "~/services/bookingService";
import { fetchMyNotifications, markNotificationAsRead }  from "~/services/notificationService";

const cx = classNames.bind(styles);

const menuItems = [
  { id: "operations", label: "Đặt Lịch & Thanh Toán", path: "/receptionist",         icon: <LayoutDashboard size={20} strokeWidth={1.5} /> },
  { id: "chat",       label: "Tư Vấn Khách Hàng",      path: "/receptionist/chat",    icon: <MessageSquare   size={20} strokeWidth={1.5} /> },
  { id: "history",    label: "Lịch Sử Giao Dịch",       path: "/receptionist/history", icon: <History         size={20} strokeWidth={1.5} /> },
];

function Receptionist() {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [branchInfo,       setBranchInfo]       = useState(null);
  const [loadingBranch,    setLoadingBranch]    = useState(true);

  // ── Notification ──────────────────────────────────────────────────────────
  const [showNotify,           setShowNotify]           = useState(false);
  const [notifications,        setNotifications]        = useState([]);
  const [unreadCount,          setUnreadCount]          = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const notifyRef = useRef(null);
  const dialogRef = useRef(null);

  const currentMenuItem = menuItems.find((i) => i.path === location.pathname) || menuItems[0];
  const activeId        = currentMenuItem.id;

  // ── Load branch + notifications ───────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoadingBranch(true);
      try {
        const [branchData, notifyData] = await Promise.all([
          fetchMyBranch(),
          fetchMyNotifications(),
        ]);
        setBranchInfo(branchData);
        setUnreadCount(notifyData.unreadCount    || 0);
        setNotifications(notifyData.notifications || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu receptionist:", err);
      } finally {
        setLoadingBranch(false);
      }
    };
    loadData();
  }, []);

  // ── Click outside đóng dropdown ───────────────────────────────────────────
  useEffect(() => {
    const handle = (e) => {
      if (
        notifyRef.current && !notifyRef.current.contains(e.target) &&
        (!dialogRef.current || !dialogRef.current.contains(e.target))
      ) setShowNotify(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Click thông báo → đánh dấu đã đọc ───────────────────────────────────
  const handleNotificationClick = async (noti) => {
    setSelectedNotification(noti);
    if (!noti.isRead) {
      const ok = await markNotificationAsRead(noti.idNotification);
      if (ok) {
        setNotifications((prev) =>
          prev.map((n) => n.idNotification === noti.idNotification ? { ...n, isRead: true } : n)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <div className={cx("adminLayout")}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className={cx("sidebar", { collapsed: sidebarCollapsed })}>
        <div className={cx("sidebarHeader")}>
          <img src="/keo.png" alt="Logo" className={cx("sidebarLogo")} />
          {!sidebarCollapsed && (
            <div className={cx("sidebarBrand")}>
              <h2 className={cx("brandTitle")}>Reception</h2>
              <span className={cx("brandSubtitle")}>Front Desk Panel</span>
            </div>
          )}
        </div>

        <nav className={cx("sidebarNav")}>
          <div className={cx("navGroup")}>
            {!sidebarCollapsed && <div className={cx("navGroupLabel")}>Nghiệp vụ quầy</div>}
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cx("navItem", { active: activeId === item.id })}
              >
                <span className={cx("navIcon")}>{item.icon}</span>
                {!sidebarCollapsed && <span className={cx("navLabel")}>{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={cx("collapseToggle")}>
          <span className={cx("toggleIcon")}>{sidebarCollapsed ? "→" : "←"}</span>
        </button>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className={cx("mainContent")}>
        <header className={cx("topHeader")}>
          <div className={cx("headerLeft")}>
            <h1 className={cx("pageTitle")}>{currentMenuItem.label}</h1>
            <div className={cx("breadcrumb")}>
              <span>{loadingBranch ? "Đang tải..." : (branchInfo?.branchName || "Chưa xác định")}</span>
              <span className={cx("separator")}>/</span>
              <span className={cx("current")}>{currentMenuItem.label}</span>
            </div>
          </div>

          <div className={cx("headerRight")}>
            {!loadingBranch && branchInfo?.address && (
              <div className={cx("branchBadge")}>
                <MapPin size={14} /><span>{branchInfo.address}</span>
              </div>
            )}

            {/* ── Bell ── */}
            <div className={cx("notificationWrapper")} ref={notifyRef}>
              <button
                className={cx("notifBtn")}
                onClick={() => setShowNotify((p) => !p)}
              >
                <Bell size={20} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className={cx("badge")}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotify && (
                <div className={cx("notifyDropdown")}>
                  <div className={cx("notifyHeader")}>
                    Thông báo
                    {unreadCount > 0 && (
                      <span className={cx("notifyUnreadBadge")}>{unreadCount} mới</span>
                    )}
                  </div>
                  <div className={cx("notifyList")}>
                    {notifications.length === 0 ? (
                      <div className={cx("notifyEmpty")}>Không có thông báo mới</div>
                    ) : (
                      notifications.map((noti) => (
                        <div
                          key={noti.idNotification}
                          className={cx("notifyItem", { unread: !noti.isRead })}
                          onClick={() => handleNotificationClick(noti)}
                        >
                          <span className={cx("notifyDot")} />
                          <div className={cx("notifyItemBody")}>
                            <p className={cx("notifyTitle")}>{noti.title}</p>
                            {noti.content && (
                              <p className={cx("notifyPreview")}>
                                {noti.content.length > 60
                                  ? noti.content.substring(0, 60) + "..."
                                  : noti.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="admin-btn-outline"><LogOut size={16} /> Thoát</button>
          </div>
        </header>

        <main className={cx("contentArea")}>
          {activeId === "operations" && <div className="fade-in"><DatLichThanhToan /></div>}
          {activeId === "chat" && (
            <div className="admin-card fade-in" style={{ height: "100%", display: "flex", flexDirection: "column", marginBottom: 0, padding: 0, overflow: "hidden" }}>
              <ChatKhachHang />
            </div>
          )}
          {activeId === "history" && <div className="admin-card fade-in"><LichSuGiaoDich /></div>}
        </main>
      </div>

      {/* ── Dialog chi tiết thông báo ───────────────────────────────────────── */}
      {selectedNotification && (
        <div className={cx("customDialogOverlay")} onClick={() => setSelectedNotification(null)}>
          <div ref={dialogRef} className={cx("customDialog")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("dialogHeader")}>
              <h3 className={cx("dialogTitle")}>{selectedNotification.title}</h3>
              <button className={cx("dialogCloseIcon")} onClick={() => setSelectedNotification(null)}>
                <X size={16} />
              </button>
            </div>
            <p className={cx("dialogContent", { noContent: !selectedNotification.content })}>
              {selectedNotification.content || "Không có nội dung chi tiết."}
            </p>
            <button className={cx("dialogCloseBtn")} onClick={() => setSelectedNotification(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Receptionist;
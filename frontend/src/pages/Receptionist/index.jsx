import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import {
  LayoutDashboard,
  MessageSquare,
  History,
  Bell,
  LogOut,
  MapPin,
  Phone,
} from "lucide-react";

import styles from "./Receptionist.module.scss";
// Import component logic cũ của bạn
import DatLichThanhToan from "./DatLichThanhToan";
import ChatKhachHang from "./ChatKhachHang"; // Giả định bạn đã có hoặc sẽ tách ra
import LichSuGiaoDich from "./LichSuGiaoDich"; // Giả định bạn đã có hoặc sẽ tách ra

const cx = classNames.bind(styles);

const menuItems = [
  {
    id: "operations",
    label: "Đặt Lịch & Thanh Toán",
    path: "/receptionist",
    icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
  },
  {
    id: "chat",
    label: "Tư Vấn Khách Hàng",
    path: "/receptionist/chat",
    icon: <MessageSquare size={20} strokeWidth={1.5} />,
  },
  {
    id: "history",
    label: "Lịch Sử Giao Dịch",
    path: "/receptionist/history",
    icon: <History size={20} strokeWidth={1.5} />,
  },
];

function Receptionist() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Thông tin chi nhánh lấy từ AuthContext hoặc hardcode tạm thời
  const currentBranch = {
    name: "Luxury Barber Lab - Q1",
    address: "123 Lê Lợi, TP.HCM",
    phone: "0901.234.567",
  };

  const currentMenuItem =
    menuItems.find((item) => item.path === location.pathname) || menuItems[0];
  const activeId = currentMenuItem.id;

  return (
    <div className={cx("adminLayout")}>
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
            {!sidebarCollapsed && (
              <div className={cx("navGroupLabel")}>Nghiệp vụ quầy</div>
            )}
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cx("navItem", { active: activeId === item.id })}
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
          <span className={cx("toggleIcon")}>
            {sidebarCollapsed ? "→" : "←"}
          </span>
        </button>
      </aside>

      <div className={cx("mainContent")}>
        <header className={cx("topHeader")}>
          <div className={cx("headerLeft")}>
            <h1 className={cx("pageTitle")}>{currentMenuItem.label}</h1>
            <div className={cx("breadcrumb")}>
              <span>{currentBranch.name}</span>
              <span className={cx("separator")}>/</span>
              <span className={cx("current")}>{currentMenuItem.label}</span>
            </div>
          </div>

          <div className={cx("headerRight")}>
            <div className={cx("branchBadge")}>
              <MapPin size={14} /> <span>{currentBranch.address}</span>
            </div>
            <button className={cx("notifBtn")}>
              <Bell size={20} strokeWidth={1.5} />
            </button>
            <button className="admin-btn-outline">
              <LogOut size={16} /> Thoát
            </button>
          </div>
        </header>

        <main className={cx("contentArea")}>
          {/* HIỂN THỊ COMPONENT THEO TAB CHỌN */}

          {/* Tab chính: Tái sử dụng component DatLichThanhToan của bạn */}
          {activeId === "operations" && (
            <div className="fade-in">
              <DatLichThanhToan />
            </div>
          )}

          {/* Tab Chat */}
          {activeId === "chat" && (
            <div
              className="admin-card fade-in"
              style={{
                height: "100%", // 👈 đổi calc(...) → 100%
                display: "flex",
                flexDirection: "column",
                marginBottom: 0,
                padding: 0, // 👈 thêm: admin-card có padding 25px sẽ cắt chiều cao
                overflow: "hidden", // 👈 thêm
              }}
            >
              <ChatKhachHang />
            </div>
          )}

          {/* Tab Lịch sử */}
          {activeId === "history" && (
            <div className="admin-card fade-in">
              <LichSuGiaoDich />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Receptionist;

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
// Import bộ icon nét mảnh sang trọng
import { 
  LayoutDashboard, 
  TrendingUp, 
  Store, 
  Scissors, 
  Users, 
  CalendarDays, 
  Ticket, 
  Wallet, 
  Award 
} from "lucide-react";

import styles from "./Admin.module.scss";
import TabNav from "~/components/TabNav";
import ThongKe from "./ThongKe";
import ThoCatToc from "./ThoCatToc";
import Voucher from "./Voucher";
import LuongThuong from "./LuongThuong";
import QuanLyDiem from "./QuanLyDiem";
import DatLichThanhToan from "./DatLichThanhToan";
import TongQuan from "./TongQuan"; 
import ChiNhanh from "./ChiNhanh";
import DichVu from "./DichVu";

const cx = classNames.bind(styles);

// Thay thế Emoji bằng Icon Component (chỉnh strokeWidth=1.5 để nét mảnh, thanh lịch)
const menuItems = [
  { id: "tongquan", label: "Tổng Quan", path: "/admin", icon: <LayoutDashboard size={20} strokeWidth={1.5} />, category: "dashboard" },
  { id: "thongke", label: "Thống Kê", path: "/admin/statics", icon: <TrendingUp size={20} strokeWidth={1.5} />, category: "dashboard" },
  { id: "chinhanh", label: "Chi Nhánh", path: "/admin/branches", icon: <Store size={20} strokeWidth={1.5} />, category: "management" },
  { id: "dichvu", label: "Dịch Vụ", path: "/admin/services", icon: <Scissors size={20} strokeWidth={1.5} />, category: "management" },
  { id: "tho", label: "Thợ Cắt Tóc", path: "/admin/barbers", icon: <Users size={20} strokeWidth={1.5} />, category: "management" },
  { id: "booking", label: "Đặt Lịch", path: "/admin/bookings", icon: <CalendarDays size={20} strokeWidth={1.5} />, category: "operations" },
  { id: "voucher", label: "Voucher", path: "/admin/vouchers", icon: <Ticket size={20} strokeWidth={1.5} />, category: "operations" },
  { id: "luong", label: "Lương Thưởng", path: "/admin/payroll", icon: <Wallet size={20} strokeWidth={1.5} />, category: "finance" },
  { id: "loyalty", label: "Chính Sách", path: "/admin/loyalty", icon: <Award size={20} strokeWidth={1.5} />, category: "operations" }
];

const menuCategories = {
  dashboard: { label: "Dashboard", items: [] },
  management: { label: "Quản Lý", items: [] },
  operations: { label: "Vận Hành", items: [] },
  finance: { label: "Tài Chính", items: [] }
};

menuItems.forEach(item => {
  if (menuCategories[item.category]) {
    menuCategories[item.category].items.push(item);
  }
});

function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentMenuItem = menuItems.find(item => item.path === location.pathname) || menuItems[0];
  const activeId = currentMenuItem.id;

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
                {!sidebarCollapsed && (
                  <div className={cx("navGroupLabel")}>{category.label}</div>
                )}
                {category.items.map(item => (
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
            );
          })}
        </nav>

        <button
          onClick={toggleSidebar}
          className={cx("collapseToggle")}
          title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
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
              <span>Admin</span>
              <span className={cx("separator")}>/</span>
              <span className={cx("current")}>{currentMenuItem.label}</span>
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
          {activeId === "booking" && <DatLichThanhToan />}
          {activeId === "loyalty" && <QuanLyDiem />}
        </main>
      </div>
    </div>
  );
}

export default Admin;
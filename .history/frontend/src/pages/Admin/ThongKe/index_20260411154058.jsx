import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./ThongKe.module.scss";

// Import các Tab con
import AiHubTab from "./Tabs/AiHubTab";
import CustomerTab from "./Tabs/CustomerTab";
import BarberTab from "./Tabs/BarberTab";
import OpsTab from "./Tabs/OpsTab";
import TrendTab from "./Tabs/TrendTab";
import RevenueTab from "./Tabs/RevenueTab";

import { 
  BrainCircuit, Users, Scissors, TrendingUp, 
  CalendarDays, LayoutDashboard, DollarSign
} from "lucide-react";

const cx = classNames.bind(styles);

function ThongKe() {
  const [activeTab, setActiveTab] = useState("revenue");

  const sidebarItems = [
    { id: "revenue", label: "Doanh thu", icon: <DollarSign size={20} /> },
    { id: "ai-hub", label: "AI Smart Hub", icon: <BrainCircuit size={20} /> },
    { id: "customer", label: "Khách hàng", icon: <Users size={20} /> },
    { id: "barber", label: "Năng lực Thợ", icon: <Scissors size={20} /> },
    { id: "ops", label: "Vận hành", icon: <CalendarDays size={20} /> },
    { id: "trend", label: "Xu hướng", icon: <TrendingUp size={20} /> },
  ];

  const activeHeader = sidebarItems.find(i => i.id === activeTab);

  return (
    <div className={cx("container")}>
      {/* --- SIDEBAR --- */}
      <aside className={cx("sidebar")}>
        <div className={cx("logoBox")}>
          <div className={cx("logoIcon")}><LayoutDashboard size={24} /></div>
          <div className={cx("logoText")}>BARBER<span>STAT</span></div>
        </div>

        <nav className={cx("navigation")}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={cx("navItem", { active: activeTab === item.id })}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={cx("sidebarFooter")}>
          <p>© 2026 AI Management</p>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={cx("mainArea")}>
        <header className={cx("topBar")}>
          <div className={cx("pageInfo")}>
            <h2>{activeHeader?.label}</h2>
            <p>Dữ liệu tổng hợp thời gian thực từ hệ thống</p>
          </div>
        </header>

        <section className={cx("contentBody")}>
          {/* Các Tab tự quản lý API bên trong */}
          {activeTab === "revenue" && <RevenueTab />}
          {activeTab === "ai-hub" && <AiHubTab />}
          {activeTab === "customer" && <CustomerTab />}
          {activeTab === "barber" && <BarberTab />}
          {activeTab === "ops" && <OpsTab />}
          {activeTab === "trend" && <TrendTab />}
        </section>
      </main>
    </div>
  );
}

export default ThongKe;
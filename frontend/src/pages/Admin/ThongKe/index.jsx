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
  CalendarDays, DollarSign
} from "lucide-react";

const cx = classNames.bind(styles);

const tabs = [
  { id: "revenue",  label: "Doanh thu",     icon: <DollarSign  size={15} strokeWidth={2} /> },
  { id: "ai-hub",   label: "AI Smart Hub",  icon: <BrainCircuit size={15} strokeWidth={2} /> },
  { id: "customer", label: "Khách hàng",    icon: <Users        size={15} strokeWidth={2} /> },
  { id: "barber",   label: "Năng lực Thợ",  icon: <Scissors     size={15} strokeWidth={2} /> },
  { id: "ops",      label: "Vận hành",      icon: <CalendarDays size={15} strokeWidth={2} /> },
  { id: "trend",    label: "Xu hướng",      icon: <TrendingUp   size={15} strokeWidth={2} /> },
];

function ThongKe() {
  const [activeTab, setActiveTab] = useState("revenue");
  const activeItem = tabs.find(t => t.id === activeTab);

  return (
    <div className={cx("wrapper")}>
      {/* ── TAB BAR ── */}
      <div className={cx("tabBar")}>
        <div className={cx("tabBarInner")}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={cx("tabBtn", { active: activeTab === tab.id })}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={cx("tabIcon")}>{tab.icon}</span>
              <span className={cx("tabLabel")}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── PAGE HEADER ── */}
      <div className={cx("pageHeader")}>
        <div className={cx("pageHeaderInner")}>
          <h2 className={cx("pageTitle")}>{activeItem?.label}</h2>
          <p className={cx("pageSubtitle")}>Dữ liệu tổng hợp thời gian thực từ hệ thống</p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className={cx("contentBody")} key={activeTab}>
        {activeTab === "revenue"  && <RevenueTab />}
        {activeTab === "ai-hub"   && <AiHubTab />}
        {activeTab === "customer" && <CustomerTab />}
        {activeTab === "barber"   && <BarberTab />}
        {activeTab === "ops"      && <OpsTab />}
        {activeTab === "trend"    && <TrendTab />}
      </div>
    </div>
  );
}

export default ThongKe;
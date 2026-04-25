import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./ThongKe.module.scss";

import AiHubTab   from "./Tabs/AiHubTab";
import CustomerTab from "./Tabs/CustomerTab";
import BarberTab   from "./Tabs/BarberTab";
import OpsTab      from "./Tabs/OpsTab";
import TrendTab    from "./Tabs/TrendTab";
import RevenueTab  from "./Tabs/RevenueTab";

import {
  BrainCircuit, Users, Scissors,
  TrendingUp, CalendarDays, DollarSign,
} from "lucide-react";

const cx = classNames.bind(styles);

const TABS = [
  { id: "revenue",  label: "Doanh Thu",     icon: DollarSign   },
  { id: "ai-hub",   label: "AI Smart Hub",  icon: BrainCircuit },
  { id: "customer", label: "Khách Hàng",    icon: Users        },
  { id: "barber",   label: "Năng Lực Thợ", icon: Scissors     },
  { id: "ops",      label: "Vận Hành",      icon: CalendarDays },
  { id: "trend",    label: "Xu Hướng",      icon: TrendingUp   },
];

export default function ThongKe() {
  const [active, setActive] = useState("revenue");
  const current = TABS.find((t) => t.id === active);

  return (
    <div className={cx("page")}>

      {/* ── HEADER ── */}
      <header className={cx("header")}>
        <div>
          <p className={cx("eyebrow")}>Thống Kê</p>
          <h1 className={cx("title")}>{current?.label}</h1>
        </div>
      </header>

      {/* ── TAB BAR ── */}
      <nav className={cx("tabBar")}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={cx("tab", { active: active === id })}
            onClick={() => setActive(id)}
          >
            <Icon size={14} strokeWidth={1.75} className={cx("tabIcon")} />
            <span className={cx("tabLabel")}>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── CONTENT ── */}
      <main className={cx("body")}>
        <div className={cx("inner")}>
          {active === "revenue"  && <RevenueTab />}
          {active === "ai-hub"   && <AiHubTab />}
          {active === "customer" && <CustomerTab />}
          {active === "barber"   && <BarberTab />}
          {active === "ops"      && <OpsTab />}
          {active === "trend"    && <TrendTab />}
        </div>
      </main>

    </div>
  );
}
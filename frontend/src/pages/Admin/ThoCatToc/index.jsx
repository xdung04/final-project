import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./ThoCatToc.module.scss";
import { Scissors, CalendarOff } from "lucide-react";

import BarberTab from "./tabs/BarberTab";
import DayOffTab from "./tabs/DayOffTab";

const cx = classNames.bind(styles);

const TABS = [
  { key: "barbers",        label: "Quản lý thợ", icon: Scissors    },
  { key: "dayOff", label: "Lịch nghỉ",    icon: CalendarOff },
];

function ThoCatToc() {
  const [activeTab, setActiveTab] = useState("barbers");

  return (
    <div className={cx("pageWrapper")}>

      {/* ── Tab Nav — nằm dưới headerArea, trên content ── */}
      <div className={cx("tabNav")}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={cx("tabBtn", { tabActive: activeTab === key })}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={14} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className={cx("tabContent")}>
        {activeTab === "barbers"        && <BarberTab />}
        {activeTab === "dayOff" && <DayOffTab />}
      </div>

    </div>
  );
}

export default ThoCatToc;
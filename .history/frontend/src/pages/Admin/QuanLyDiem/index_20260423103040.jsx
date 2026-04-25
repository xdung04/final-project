import React, { useState } from "react";
import TabTichDiem from "./TabTichDiem";
import classNames from "classnames/bind";
import styles from "./QuanLyDiem.module.scss";

const cx = classNames.bind(styles);

export default function QuanLyDiem() {
  const [activeSubTab, setActiveSubTab] = useState("tichdiem");

  return (
    <div className={cx("wrapper")}>
      <div className={cx("subTabNav")}>
        <button
          className={cx("subTabBtn", { active: activeSubTab === "tichdiem" })}
          onClick={() => setActiveSubTab("tichdiem")}
        >
          Tích điểm
        </button>
      </div>

      <div>
        {activeSubTab === "tichdiem" && <TabTichDiem />}
      </div>
    </div>
  );
}

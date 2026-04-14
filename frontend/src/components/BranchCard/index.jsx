import React from "react";
import { MapPin, Edit3, Play, Pause, Users, DollarSign, Clock } from "lucide-react";
import classNames from "classnames/bind";
import styles from "./BranchCard.module.scss";

const cx = classNames.bind(styles);

function BranchCard({ name, address, manager, staff, revenue, status, onEdit, onToggle, onViewReceptionist, suspendInfo = {} }) {
  const { isSuspended = false, suspendDate = null, resumeDate = null } = suspendInfo;
  const today = new Date().toISOString().split("T")[0];
  const isActive = status === "Hoạt động";

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const getToggleContent = () => {
    if (isActive) return { text: "Tạm ngưng", icon: <Pause size={16} /> };
    if (suspendDate && suspendDate > today) return { text: `Ngưng từ ${formatDate(suspendDate)}`, icon: <Pause size={16} /> };
    if (resumeDate && resumeDate > today) return { text: `Mở lại ${formatDate(resumeDate)}`, icon: <Play size={16} /> };
    return { text: "Kích hoạt", icon: <Play size={16} /> };
  };

  const btnContent = getToggleContent();

  return (
    <div className={cx("card")}>
      <div className={cx("cardHeader")}>
        <div className={cx("titleGroup")}>
          <h3>{name}</h3>
          <div className={cx("statusTag", isSuspended ? "suspended" : "active")}>
            {isSuspended ? "Đang tạm ngưng" : "Đang hoạt động"}
          </div>
        </div>
      </div>

      <p className={cx("address")}>
        <MapPin size={16} /> {address}
      </p>

      <div className={cx("statsGrid")}>
        <div className={cx("statItem")}>
          <label><Users size={12} /> Thợ</label>
          <value>{staff}</value>
        </div>
        <div className={cx("statItem")}>
          <label><DollarSign size={12} /> Thu</label>
          <value>{revenue.length > 5 ? revenue.substring(0, 5) + '..' : revenue}</value>
        </div>
        <div className={cx("statItem")}>
          <label><Clock size={12} /> Ca</label>
          <value>30p</value>
        </div>
      </div>

      {/* Khu vực thông tin Lễ tân - Có thể click */}
      <div className={cx("managerInfo")} onClick={() => onViewReceptionist(manager)}>
        <div className={cx("avatarPlaceholder")}>
          {(manager?.fullName || "B").charAt(0).toUpperCase()}
        </div>
        <div className={cx("managerDetails")}>
          <span>Lễ tân (Click xem chi tiết)</span>
          <strong>{manager?.fullName || "Chưa có quản lý"}</strong>
        </div>
      </div>

      <div className={cx("actions")}>
        <button className={cx("editBtn")} onClick={onEdit}>
          <Edit3 size={16} />
        </button>

        <button 
          className={cx("toggleBtn", { off: !isActive })} 
          onClick={onToggle}
          disabled={suspendInfo.isScheduledSuspend}
        >
          {btnContent.icon}
          {btnContent.text}
        </button>
      </div>
    </div>
  );
}

export default BranchCard;
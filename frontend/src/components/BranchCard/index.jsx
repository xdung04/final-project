import React from "react";
import { MapPin, Edit3, Play, Pause, Users, DollarSign, Clock, UserCircle } from "lucide-react";
import classNames from "classnames/bind";
import styles from "./BranchCard.module.scss";

const cx = classNames.bind(styles);

function BranchCard({
  name,
  address,
  manager,
  staff,
  revenue,
  status,
  openTime,
  closeTime,
  services = [],
  onEdit,
  onToggle,
  onViewReceptionist,
  suspendInfo = {},
}) {
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
    if (suspendDate && suspendDate > today)
      return {
        text: `Ngưng từ ${formatDate(suspendDate)}`,
        icon: <Pause size={16} />,
      };
    if (resumeDate && resumeDate > today)
      return {
        text: `Mở lại ${formatDate(resumeDate)}`,
        icon: <Play size={16} />,
      };
    return { text: "Kích hoạt", icon: <Play size={16} /> };
  };

  const btnContent = getToggleContent();

  return (
    <div className={cx("card")}>
      {/* ── Header ── */}
      <div className={cx("cardHeader")}>
        <div className={cx("titleGroup")}>
          <h3>{name}</h3>
          <div className={cx("statusTag", isSuspended ? "suspended" : "active")}>
            {isSuspended ? "Đang tạm ngưng" : "Đang hoạt động"}
          </div>
        </div>
      </div>

      {/* ── Địa chỉ ── */}
      <p className={cx("address")}>
        <MapPin size={16} />
        {address}
      </p>

      {/* ── Thống kê ── */}
      <div className={cx("statsGrid")}>
        <div className={cx("statItem")}>
          <label>
            <Users size={12} /> Thợ
          </label>
          <value>{staff}</value>
        </div>
        <div className={cx("statItem")}>
          <label>
            <DollarSign size={12} /> Doanh thu
          </label>
          <value title={revenue}>
            {typeof revenue === "string" && revenue.length > 10 ? revenue.substring(0, 10) + ".." : revenue}
          </value>
        </div>
        <div className={cx("statItem")}>
          <label>
            <Clock size={12} /> Giờ mở
          </label>
          <value>{openTime ? String(openTime).substring(0, 5) : "—"}</value>
        </div>
      </div>

      {/* ── Dịch vụ ── */}
      {services.length > 0 && (
        <div className={cx("serviceTagList")}>
          {services.slice(0, 3).map((s) => (
            <span key={s.idService} className={cx("serviceTag")}>
              {s.name}
            </span>
          ))}
          {services.length > 3 && <span className={cx("serviceTag", "serviceTagMore")}>+{services.length - 3}</span>}
        </div>
      )}

      {/* ── Thông tin Lễ tân ── */}
      <div
        className={cx("managerInfo")}
        onClick={() => onViewReceptionist && onViewReceptionist(manager)}
        title="Click để xem chi tiết lễ tân"
      >
        <div className={cx("avatarPlaceholder")}>
          <UserCircle size={20} />
        </div>
        <div className={cx("managerDetails")}>
          <span>Lễ tân (Click xem chi tiết)</span>
          <strong>{manager?.fullName || "Chưa có lễ tân"}</strong>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className={cx("actions")}>
        <button className={cx("editBtn")} onClick={onEdit} title="Chỉnh sửa">
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

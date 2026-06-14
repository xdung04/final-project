import React from "react";
import classNames from "classnames/bind";
import styles from "./LoyaltyRuleCard.module.scss";
import { Edit2, Trash2 } from "lucide-react";

const cx = classNames.bind(styles);

export default function LoyaltyRuleCard({ rule, onEdit, onDelete }) {
  if (!rule) return null;

  const isDefault = rule.is_default;

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount ?? 0) + "đ";

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const hasDateRange = !isDefault && (rule.start_date || rule.end_date);

  return (
    <div className={cx("card", { default: isDefault })}>

      {/* ── Dark header ─────────────────────────────────────────── */}
      <div className={cx("cardHead")}>
        <div className={cx("cardHead__left")}>
          <span className={cx("cardHead__name")}>
            {isDefault ? "Quy tắc hệ thống" : "Chiến dịch đặc biệt"}
          </span>
          {isDefault && (
            <span className={cx("defaultLabel")}>Mặc định</span>
          )}
        </div>
      </div>

      {/* ── Body stats ──────────────────────────────────────────── */}
      <div className={cx("cardBody")}>
        <div className={cx("stat")}>
          <span className={cx("stat__label")}>Giá trị 1 điểm</span>
          <span className={cx("stat__value")}>{formatVND(rule.money_per_point)}</span>
        </div>

        <div className={cx("stat")}>
          <span className={cx("stat__label")}>Hệ số nhân</span>
          <span className={cx("stat__value")}>×{rule.point_multiplier ?? 1}</span>
        </div>

        <div className={cx("stat")}>
          <span className={cx("stat__label")}>Đơn tối thiểu</span>
          <span className={cx("stat__value")}>{formatVND(rule.min_order_amount)}</span>
        </div>

        {hasDateRange && (
          <div className={cx("timeRange")}>
            Thời gian áp dụng:{" "}
            {formatDate(rule.start_date)} — {formatDate(rule.end_date)}
          </div>
        )}
      </div>

      {/* ── Footer actions ──────────────────────────────────────── */}
      <div className={cx("cardFooter")}>
        <button className={cx("btnEdit")} onClick={() => onEdit(rule)} title="Chỉnh sửa">
          <Edit2 size={12} strokeWidth={2} /> Sửa
        </button>
        <button className={cx("btnDelete")} onClick={() => onDelete(rule.idRule)} title="Xoá quy tắc">
          <Trash2 size={12} strokeWidth={2} /> Xoá
        </button>
      </div>
    </div>
  );
}
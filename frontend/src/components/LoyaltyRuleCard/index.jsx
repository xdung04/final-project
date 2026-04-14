import React from "react";
import classNames from "classnames/bind";
import styles from "./LoyaltyRuleCard.module.scss";

const cx = classNames.bind(styles);

function LoyaltyRuleCard({ rule, onEdit, onDelete }) {
  if (!rule) return null;

  // Hàm hỗ trợ định dạng tiền tệ chuyên nghiệp
  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  };

  return (
    <div className={cx("card", { default: rule.is_default })}>
      {/* ===== PHẦN TIÊU ĐỀ & HÀNH ĐỘNG ===== */}
      <div className={cx("header")}>
        <h3>
          {rule.is_default ? (
            <span className={cx("defaultLabel")}>Quy tắc hệ thống</span>
          ) : (
            "Chiến dịch đặc biệt"
          )}
        </h3>
        <div className={cx("actions")}>
          <button className={cx("btn-edit")} onClick={() => onEdit(rule)}>
            Sửa
          </button>
          <button
            className={cx("btn-delete")}
            onClick={() => onDelete(rule.idRule)} // Giả sử id là idRule
          >
            Xoá
          </button>
        </div>
      </div>

      {/* ===== PHẦN THÔNG SỐ (Dạng Grid) ===== */}
      <div className={cx("body")}>
        <p>
          <strong>Giá trị 1 điểm</strong>
          <span className={cx("value")}>{formatVND(rule.money_per_point)}</span>
        </p>

        <p>
          <strong>Hệ số nhân</strong>
          <span className={cx("value")}>x{rule.point_multiplier}</span>
        </p>

        <p>
          <strong>Đơn tối thiểu</strong>
          <span className={cx("value")}>{formatVND(rule.min_order_amount)}</span>
        </p>

        {/* Thời gian chỉ hiện nếu không phải quy tắc mặc định */}
        {!rule.is_default && (
          <div className={cx("timeRange")}>
            <strong>Thời gian áp dụng</strong>
            <span>
              {rule.start_date?.split("T")[0]} — {rule.end_date?.split("T")[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoyaltyRuleCard;
import React from "react";
import classNames from "classnames/bind";
import styles from "./PromoCard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function PromoCard({ voucher, onEdit, onDelete }) {
  if (!voucher) return null;

  const {
    idVoucher,
    title,
    description,
    discountPercent,
    pointCost,
    totalQuantity,
    expiryDate,
    status,
  } = voucher;

// ... (giữ nguyên phần trên)

  return (
    <div className={cx("card", { inactive: !status })}>
      <div className={cx("cardHeader")}>
        <div>
          <h3 className={cx("title")}>{title}</h3>
          <p className={cx("desc")}>{description || "Không có mô tả chi tiết"}</p>
        </div>
        <span className={cx("status", { inactive: !status })}>
          {status ? "Đang chạy" : "Tạm dừng"}
        </span>
      </div>

      <div className={cx("infoRow")}>
        <div>
          <p className={cx("label")}>Ưu đãi</p>
          <strong>{discountPercent}% OFF</strong>
        </div>
        <div>
          <p className={cx("label")}>Chi phí</p>
          <strong>{pointCost} Pts</strong>
        </div>
        <div>
          <p className={cx("label")}>Số lượng</p>
          <strong>{totalQuantity ?? "∞"}</strong>
        </div>
        <div>
          <p className={cx("label")}>Hạn dùng</p>
          <strong>{expiryDate?.split("T")[0]}</strong>
        </div>
      </div>

      <div className={cx("actions")}>
        <button className={cx("editBtn")} onClick={() => onEdit(voucher)}>
          <FontAwesomeIcon icon={faPenToSquare} /> Sửa
        </button>

        {onDelete && (
          <button
            className={cx("deleteBtn")}
            onClick={() => onDelete(idVoucher)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>
    </div>
  );
}

export default PromoCard;

import React from "react";
import classNames from "classnames/bind";
import styles from "./PayslipModal.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faXmark, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function PayslipModal({ data, month, year, onClose }) {
  if (!data) return null;

  const formatVND = (num) => new Intl.NumberFormat("vi-VN").format(num || 0) + "đ";

  // Tính toán sơ bộ
  const totalIncome = (data.baseSalary || 0) + (data.commission || 0) + (data.tip || 0) + (data.bonus || 0);
  const deductions = data.deductions || 0;
  const netSalary = totalIncome - deductions;

  return (
    <div className={cx("overlay")} onClick={onClose}>
      <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
        <button className={cx("closeBtn")} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className={cx("receipt")}>
          {/* Header Phiếu Lương */}
          <div className={cx("header")}>
            <p className={cx("salonName")}>GENTLEMAN BARBER CLUB</p>
            <h1>PHIẾU LƯƠNG CHI TIẾT</h1>
            <p className={cx("period")}>Tháng {month} năm {year}</p>
          </div>

          <div className={cx("divider")} />

          {/* Thông tin nhân sự */}
          <div className={cx("empInfo")}>
            <div className={cx("infoRow")}>
              <span>Họ và tên:</span>
              <strong>{data.barberName}</strong>
            </div>
            <div className={cx("infoRow")}>
              <span>Chi nhánh:</span>
              <span>{data.branchName}</span>
            </div>
            <div className={cx("infoRow")}>
              <span>Trạng thái:</span>
              <span className={cx("status")}>
                <FontAwesomeIcon icon={faCheckCircle} /> {data.status || "Đang xử lý"}
              </span>
            </div>
          </div>

          <div className={cx("divider")} />

          {/* Chi tiết thu nhập */}
          <div className={cx("section")}>
            <h3>CÁC KHOẢN THU NHẬP (+)</h3>
            <div className={cx("item")}>
              <span>Lương cơ bản:</span>
              <span>{formatVND(data.baseSalary)}</span>
            </div>
            <div className={cx("item")}>
              <span>Hoa hồng dịch vụ (15%):</span>
              <span>{formatVND(data.commission)}</span>
            </div>
            <div className={cx("item")}>
              <span>Tiền Tip (từ App/Web):</span>
              <span>{formatVND(data.tip)}</span>
            </div>
            <div className={cx("item")}>
              <span>Thưởng hiệu quả:</span>
              <span>{formatVND(data.bonus)}</span>
            </div>
            <div className={cx("totalRow")}>
              <span>Tổng thu nhập:</span>
              <span>{formatVND(totalIncome)}</span>
            </div>
          </div>

          {/* Chi tiết khấu trừ */}
          <div className={cx("section")}>
            <h3>CÁC KHOẢN KHẤU TRỪ (-)</h3>
            <div className={cx("item")}>
              <span>Tạm ứng lương:</span>
              <span>{formatVND(data.advancePayment || 0)}</span>
            </div>
            <div className={cx("item")}>
              <span>Vi phạm & Kỷ luật:</span>
              <span>{formatVND(data.fines || 0)}</span>
            </div>
            <div className={cx("totalRow", "deduct")}>
              <span>Tổng khấu trừ:</span>
              <span>-{formatVND(deductions)}</span>
            </div>
          </div>

          <div className={cx("dashedDivider")} />

          {/* Tổng thực nhận */}
          <div className={cx("footer")}>
            <div className={cx("netSalaryRow")}>
              <span>THỰC NHẬN:</span>
              <span className={cx("amount")}>{formatVND(netSalary)}</span>
            </div>
            <p className={cx("note")}>
              * Mọi thắc mắc về bảng lương vui lòng liên hệ quản lý trong vòng 24h kể từ khi nhận phiếu.
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className={cx("actions")}>
          <button className={cx("printBtn")} onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} /> In phiếu lương
          </button>
        </div>
      </div>
    </div>
  );
}

export default PayslipModal;
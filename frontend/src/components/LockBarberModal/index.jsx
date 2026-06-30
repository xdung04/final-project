import React, { useState } from "react";
import classNames from "classnames/bind";
import { CalendarClock, AlertTriangle, Loader2, X } from "lucide-react";
import { BarberAPI } from "~/apis/barberAPI";
import styles from "./LockBarberModal.module.scss";

const cx = classNames.bind(styles);

function LockBarberModal({ barber, onClose, onSuccess, showToast }) {
  const [lockDate, setLockDate] = useState("");
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lockDate) {
      showToast("error", "Vui lòng chọn ngày khóa!");
      return;
    }

    setLoading(true);
    try {
      const res = await BarberAPI.setLockDate(barber.idBarber, lockDate);

      if (!res?.success) {
        showToast("error", res?.message || "Không thể cài đặt ngày khóa!");
        return;
      }

      showToast("success", res.message);
      await onSuccess();
      onClose();
    } catch (err) {
      showToast("error", err?.response?.data?.message || err?.message || "Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx("overlay")}>
      <div className={cx("dialog")}>
        {/* ── Header ─────────────────────────────────── */}
        <div className={cx("header")}>
          <div className={cx("headerIconWrap")}>
            <CalendarClock size={20} />
          </div>
          <div className={cx("headerText")}>
            <h3>Lên lịch khóa tài khoản</h3>
            <p>Cài đặt ngày hiệu lực</p>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className={cx("body")}>
          {/* Warning */}
          <div className={cx("warningBanner")}>
            <AlertTriangle size={16} className={cx("warnIcon")} />
            <p>
              Tài khoản của <strong>{barber?.fullName}</strong> sẽ tự động bị khóa vào ngày đã chọn. Hệ thống sẽ kiểm
              tra và từ chối nếu còn lịch hẹn chưa hoàn tất.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className={cx("formGroup")}>
              <label htmlFor="lock-date">Ngày khóa tài khoản</label>
              <div className={cx("inputWrap")}>
                <CalendarClock size={15} className={cx("inputIcon")} />
                <input
                  id="lock-date"
                  type="date"
                  value={lockDate}
                  min={tomorrow}
                  onChange={(e) => setLockDate(e.target.value)}
                  required
                />
              </div>
              <span className={cx("hint")}>* Phải chọn ngày sớm nhất là ngày mai</span>
            </div>

            <div className={cx("actions")}>
              <button type="button" className={cx("cancelBtn")} onClick={onClose} disabled={loading}>
                <X size={14} /> Hủy bỏ
              </button>
              <button type="submit" className={cx("confirmBtn")} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={14} className={cx("spinIcon")} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CalendarClock size={14} />
                    Xác nhận lịch khóa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LockBarberModal;

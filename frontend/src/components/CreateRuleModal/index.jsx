import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./CreateRuleModal.module.scss";
import { Check } from "lucide-react";

const cx = classNames.bind(styles);

export default function CreateRuleModal({ initialData, onClose, onCreate }) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name:          "",
    minSpend:      "",
    pointsAwarded: "",
    multiplier:    "1",
    isDefault:     false,
    hasDateRange:  false,
    startDate:     "",
    endDate:       "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        name:          initialData.name          ?? "",
        minSpend:      initialData.minSpend       ?? "",
        pointsAwarded: initialData.pointsAwarded  ?? "",
        multiplier:    initialData.multiplier      ?? "1",
        isDefault:     initialData.isDefault       ?? false,
        hasDateRange:  !!(initialData.startDate || initialData.endDate),
        startDate:     initialData.startDate       ?? "",
        endDate:       initialData.endDate          ?? "",
      });
    }
  }, [initialData]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.name.trim())        return setError("Vui lòng nhập tên quy tắc.");
    if (!form.pointsAwarded)      return setError("Vui lòng nhập số điểm thưởng.");
    if (form.hasDateRange && !form.startDate) return setError("Vui lòng chọn ngày bắt đầu.");

    setError("");
    const payload = {
      name:          form.name.trim(),
      minSpend:      Number(form.minSpend) || 0,
      pointsAwarded: Number(form.pointsAwarded),
      multiplier:    Number(form.multiplier) || 1,
      isDefault:     form.isDefault,
      startDate:     form.hasDateRange ? form.startDate : null,
      endDate:       form.hasDateRange ? form.endDate   : null,
    };
    onCreate(payload);
  };

  return (
    <div className={cx("overlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modal")}>

        {/* ── Dark header ─────────────────────────────────────────── */}
        <div className={cx("modalHead")}>
          <h2>{isEdit ? "Chỉnh sửa quy tắc" : "Tạo quy tắc tích điểm"}</h2>
          <p className={cx("modalSub")}>
            {isEdit ? "Cập nhật thông tin quy tắc tích điểm" : "Thiết lập điều kiện và phần thưởng điểm mới"}
          </p>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className={cx("modalBody")}>

          {/* Tên quy tắc */}
          <div className={cx("field")}>
            <label>Tên quy tắc</label>
            <input
              type="text"
              placeholder="VD: Tích điểm thường"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Điểm & hệ số */}
          <div className={cx("row2")}>
            <div className={cx("field")}>
              <label>Điểm thưởng</label>
              <input
                type="number"
                min="0"
                placeholder="10"
                value={form.pointsAwarded}
                onChange={(e) => set("pointsAwarded", e.target.value)}
              />
            </div>
            <div className={cx("field")}>
              <label>Hệ số nhân</label>
              <input
                type="number"
                min="1"
                step="0.1"
                placeholder="1"
                value={form.multiplier}
                onChange={(e) => set("multiplier", e.target.value)}
              />
            </div>
          </div>

          {/* Chi tiêu tối thiểu */}
          <div className={cx("field")}>
            <label>Chi tiêu tối thiểu (đ)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.minSpend}
              onChange={(e) => set("minSpend", e.target.value)}
            />
          </div>

          {/* Quy tắc mặc định */}
          <div
            className={cx("checkItem", { active: form.isDefault })}
            onClick={() => set("isDefault", !form.isDefault)}
          >
            <div className={cx("cbBox", { cbChecked: form.isDefault })}>
              {form.isDefault && <Check size={11} color="#F5F0E8" strokeWidth={3} />}
            </div>
            <div className={cx("checkTexts")}>
              <span className={cx("checkName")}>Đặt làm quy tắc mặc định</span>
              <span className={cx("checkHint")}>Áp dụng cho tất cả giao dịch không có quy tắc riêng</span>
            </div>
          </div>

          {/* Giới hạn thời gian */}
          <div
            className={cx("checkItem", { active: form.hasDateRange })}
            onClick={() => set("hasDateRange", !form.hasDateRange)}
          >
            <div className={cx("cbBox", { cbChecked: form.hasDateRange })}>
              {form.hasDateRange && <Check size={11} color="#F5F0E8" strokeWidth={3} />}
            </div>
            <div className={cx("checkTexts")}>
              <span className={cx("checkName")}>Giới hạn thời gian</span>
              <span className={cx("checkHint")}>Chỉ áp dụng trong khoảng thời gian nhất định</span>
            </div>
          </div>

          {/* Date range — animated show/hide */}
          <div className={cx("dateWrap", { hidden: !form.hasDateRange })}>
            <div className={cx("row2")}>
              <div className={cx("field")}>
                <label>Ngày bắt đầu</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </div>
              <div className={cx("field")}>
                <label>Ngày kết thúc</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && <div className={cx("error")}>{error}</div>}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className={cx("modalFooter")}>
          <button className={cx("btnGhost")} onClick={onClose}>Huỷ</button>
          <button className={cx("btnPrimary")} onClick={handleSubmit}>
            {isEdit ? "Lưu thay đổi" : "Tạo quy tắc"}
          </button>
        </div>
      </div>
    </div>
  );
}
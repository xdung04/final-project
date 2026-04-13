import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./BonusModal.module.scss";

const cx = classNames.bind(styles);

function BonusModal({ initialData, onClose, onCreate }) {
  const [form, setForm] = useState({
    minRevenue: "",
    bonusPercent: "",
    note: "",
    active: true,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        minRevenue: initialData.minRevenue
          ? Number(initialData.minRevenue).toLocaleString("vi-VN")
          : "",
        bonusPercent: initialData.bonusPercent || "",
        note: initialData.note || "",
        active: initialData.active ?? true,
      });
    }
  }, [initialData]);

  const formatCurrency = (value) => {
    if (!value) return "";
    const numeric = value.toString().replace(/\D/g, "");
    return numeric ? Number(numeric).toLocaleString("vi-VN") : "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "minRevenue") {
      setForm((prev) => ({ ...prev, [name]: formatCurrency(value) }));
    } else if (name === "bonusPercent") {
      const numeric = value.replace(/[^0-9.]/g, "");
      setForm((prev) => ({ ...prev, [name]: numeric }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (error) setError("");
  };

  const toggleActive = () => {
    setForm((prev) => ({ ...prev, active: !prev.active }));
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.minRevenue || !form.bonusPercent) {
      setError("Vui lòng nhập đầy đủ doanh số và tỷ lệ thưởng.");
      return;
    }

    const payload = {
      ...form,
      minRevenue: Number(form.minRevenue.toString().replace(/\./g, "")),
      bonusPercent: Number(form.bonusPercent),
    };

    onCreate(payload);
  };

  return (
    <div className={cx("overlay")} onClick={onClose}>
      <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          
          {/* Header */}
          <div className={cx("modal-header")}>
            <h2>{initialData ? "Cập nhật mức thưởng" : "Tạo mức thưởng mới"}</h2>
            <p className={cx("modal-sub")}>
              Thiết lập tỷ lệ hoa hồng dựa trên mốc doanh số đạt được.
            </p>
          </div>
          
          <div className={cx("divider")} />

          {/* Body */}
          <div className={cx("modal-body")}>
            <div className={cx("row-2")}>
              <div className={cx("field")}>
                <label>Doanh số (VNĐ)</label>
                <input
                  type="text"
                  name="minRevenue"
                  value={form.minRevenue}
                  onChange={handleChange}
                  placeholder="VD: 10.000.000"
                  autoComplete="off"
                />
              </div>
              <div className={cx("field")}>
                <label>Tỷ lệ (%)</label>
                <input
                  type="text"
                  name="bonusPercent"
                  value={form.bonusPercent}
                  onChange={handleChange}
                  placeholder="VD: 5"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className={cx("field")}>
              <label>Ghi chú</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Điều kiện áp dụng (nếu có)..."
              />
            </div>

            {/* Custom Checkbox Luxury */}
            <div
              className={cx("check-item", { active: form.active })}
              onClick={toggleActive}
            >
              <div className={cx("cb-box", { "cb-checked": form.active })}>
                {form.active && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className={cx("check-texts")}>
                <span className={cx("check-name")}>Kích hoạt mức thưởng</span>
                <span className={cx("check-hint")}>
                  Áp dụng ngay cho nhân sự đạt mốc doanh số này.
                </span>
              </div>
            </div>

            {error && <div className={cx("error")}>{error}</div>}
          </div>

          {/* Footer */}
          <div className={cx("modal-footer")}>
            <button
              type="button"
              className={cx("btn-ghost")}
              onClick={onClose}
            >
              Hủy bỏ
            </button>
            <button type="submit" className={cx("btn-primary")}>
              {initialData ? "Lưu thay đổi" : "Khởi tạo"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default BonusModal;
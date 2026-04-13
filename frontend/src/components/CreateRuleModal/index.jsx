import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./CreateRuleModal.module.scss";

const cx = classNames.bind(styles);

// Checkbox tự render — tránh hoàn toàn vấn đề CSS ::after với SCSS modules
function CustomCheckbox({ checked }) {
  return (
    <span className={cx("cb-box", { "cb-checked": checked })}>
      {checked && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline
            points="1.5,5 4,7.5 8.5,2"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function CreateRuleModal({ onClose, onCreate, initialData }) {
  const [form, setForm] = useState({
    money_per_point: 0,
    point_multiplier: 1,
    min_order_amount: 0,
    is_default: false,
    is_active: true,
    start_date: "",
    end_date: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        money_per_point: initialData.money_per_point || 0,
        point_multiplier: initialData.point_multiplier || 1,
        min_order_amount: initialData.min_order_amount || 0,
        is_default: initialData.is_default || false,
        is_active: initialData.is_active ?? true,
        start_date: initialData.start_date ? initialData.start_date.slice(0, 10) : "",
        end_date: initialData.end_date ? initialData.end_date.slice(0, 10) : "",
      });
    }
  }, [initialData]);

  const formatMoneyDisplay = (val) => {
    if (!val) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "money_per_point" || name === "min_order_amount") {
      const raw = value.replace(/[^0-9]/g, "");
      setForm((prev) => ({ ...prev, [name]: Number(raw) || 0 }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
    if (error) setError("");
  };

  const toggleField = (fieldName) => {
    setForm((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.is_default && (!form.start_date || !form.end_date)) {
      setError("Vui lòng nhập thời gian áp dụng cho quy tắc thường.");
      return;
    }
    setError("");
    onCreate(form);
    onClose();
  };

  return (
    <div className={cx("overlay")} onClick={onClose}>
      <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>

        <div className={cx("modal-header")}>
          <h2>{initialData ? "Cập nhật chính sách" : "Tạo quy tắc mới"}</h2>
          <p className={cx("modal-sub")}>Cấu hình chính sách tích điểm cho đơn hàng</p>
        </div>

        <div className={cx("divider")} />

        <div className={cx("modal-body")}>
          <div className={cx("field")}>
            <label htmlFor="money_per_point">Giá trị đổi 1 điểm (VND)</label>
            <input
              id="money_per_point"
              type="text"
              name="money_per_point"
              value={formatMoneyDisplay(form.money_per_point)}
              onChange={handleChange}
              placeholder="VD: 10.000"
            />
          </div>

          <div className={cx("row-2")}>
            <div className={cx("field")}>
              <label htmlFor="point_multiplier">Hệ số nhân (×)</label>
              <input
                id="point_multiplier"
                type="number"
                step="0.1"
                name="point_multiplier"
                value={form.point_multiplier}
                onChange={handleChange}
              />
            </div>
            <div className={cx("field")}>
              <label htmlFor="min_order_amount">Đơn tối thiểu (VND)</label>
              <input
                id="min_order_amount"
                type="text"
                name="min_order_amount"
                value={formatMoneyDisplay(form.min_order_amount)}
                onChange={handleChange}
                placeholder="VD: 50.000"
              />
            </div>
          </div>

          <div
            className={cx("check-item", { active: form.is_default })}
            onClick={() => toggleField("is_default")}
          >
            <CustomCheckbox checked={form.is_default} />
            <div className={cx("check-texts")}>
              <span className={cx("check-name")}>Quy tắc mặc định</span>
              <span className={cx("check-hint")}>Không giới hạn thời gian áp dụng</span>
            </div>
          </div>

          <div className={cx("date-wrap", { hidden: form.is_default })}>
            <div className={cx("row-2")}>
              <div className={cx("field")}>
                <label htmlFor="start_date">Ngày bắt đầu</label>
                <input
                  id="start_date"
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                />
              </div>
              <div className={cx("field")}>
                <label htmlFor="end_date">Ngày kết thúc</label>
                <input
                  id="end_date"
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div
            className={cx("check-item", { active: form.is_active })}
            onClick={() => toggleField("is_active")}
          >
            <CustomCheckbox checked={form.is_active} />
            <div className={cx("check-texts")}>
              <span className={cx("check-name")}>Kích hoạt ngay</span>
              <span className={cx("check-hint")}>Có hiệu lực ngay sau khi tạo</span>
            </div>
          </div>

          {error && <p className={cx("error")}>{error}</p>}
        </div>

        <div className={cx("modal-footer")}>
          <button type="button" className={cx("btn-ghost")} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className={cx("btn-primary")} onClick={handleSubmit}>
            {initialData ? "Lưu thay đổi" : "Tạo quy tắc"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreateRuleModal;
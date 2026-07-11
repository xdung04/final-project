import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import styles from "./CreateRuleModal.module.scss";
import { Check } from "lucide-react";

const cx = classNames.bind(styles);

export default function CreateRuleModal({ initialData, onClose, onCreate, showToast }) {
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
      const toDateStr = (val) => {
      if (!val) return "";
      return val.substring(0, 10); // cắt lấy "YYYY-MM-DD"
    };
      setForm({
        name:          initialData.name           ?? "",
        minSpend:      initialData.min_order_amount ?? "",
        pointsAwarded: initialData.money_per_point  ?? "",
        multiplier:    initialData.point_multiplier ?? "1",
        isDefault:     initialData.is_default       ?? false,
        hasDateRange:  !!(initialData.start_date || initialData.end_date),
        startDate:     toDateStr(initialData.start_date),
        endDate:       toDateStr(initialData.end_date),
      });
    }
  }, [initialData]);

  // ✅ Bật default → tắt dateRange + clear dates
  const handleToggleDefault = () => {
    const newVal = !form.isDefault;
    setForm((prev) => ({
      ...prev,
      isDefault:    newVal,
      hasDateRange: newVal ? false : prev.hasDateRange,
      startDate:    newVal ? "" : prev.startDate,
      endDate:      newVal ? "" : prev.endDate,
    }));
  };

  // ✅ Bật dateRange → tắt default
  const handleToggleDateRange = () => {
    const newVal = !form.hasDateRange;
    setForm((prev) => ({
      ...prev,
      hasDateRange: newVal,
      isDefault:    newVal ? false : prev.isDefault,
    }));
  };

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));


// Thay thế hàm handleSubmit cũ bằng code này:
const handleSubmit = async (e) => {
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
  }

  // Validate inline
  if (!form.name.trim()) return setError("Vui lòng nhập tên quy tắc.");
  if (!form.pointsAwarded) return setError("Vui lòng nhập số điểm thưởng.");
  if (form.hasDateRange && (!form.startDate || !form.endDate))
    return setError("Vui lòng chọn cả ngày bắt đầu và kết thúc.");

  setError("");

  const payload = {
    name:             form.name.trim(),
    min_order_amount: Number(form.minSpend) || 0,
    money_per_point:  Number(form.pointsAwarded),
    point_multiplier: Number(form.multiplier) || 1,
    is_default:       form.isDefault,
    start_date:       form.hasDateRange ? form.startDate : null,
    end_date:         form.hasDateRange ? form.endDate   : null,
  };

  // Gọi hàm từ cha và chờ kết quả boolean
  const isSuccess = await onCreate(payload);

  // Nếu cha xử lý thành công (true), thì mới đóng modal
  // Nếu lỗi (false), thì không làm gì cả (modal vẫn mở để sửa lỗi)
  if (isSuccess) {
    onClose();
  }
};

  return createPortal(
    <div className={cx("overlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modal")}>

        {/* ── Dark header ─────────────────────────────────────────── */}
        <div className={cx("modalHead")}>
          <h2>{isEdit ? "Chỉnh sửa quy tắc" : "Tạo quy tắc tích điểm"}</h2>
          <p className={cx("modalSub")}>
            {isEdit
              ? "Cập nhật thông tin quy tắc tích điểm"
              : "Thiết lập điều kiện và phần thưởng điểm mới"}
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
            onClick={handleToggleDefault}
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
            onClick={handleToggleDateRange}
          >
            <div className={cx("cbBox", { cbChecked: form.hasDateRange })}>
              {form.hasDateRange && <Check size={11} color="#F5F0E8" strokeWidth={3} />}
            </div>
            <div className={cx("checkTexts")}>
              <span className={cx("checkName")}>Giới hạn thời gian</span>
              <span className={cx("checkHint")}>Chỉ áp dụng trong khoảng thời gian nhất định</span>
            </div>
          </div>

          {/* Date range */}
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

          {/* ✅ Lỗi validate inline */}
          {error && <div className={cx("error")}>{error}</div>}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className={cx("modalFooter")}>
          <button className={cx("btnGhost")} onClick={onClose}>Huỷ</button>
         <button className={cx("btnPrimary")} onClick={(e) => handleSubmit(e)}>
  {isEdit ? "Lưu thay đổi" : "Tạo quy tắc"}
</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
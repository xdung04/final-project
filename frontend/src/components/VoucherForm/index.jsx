import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { createVoucher, updateVoucher } from "~/services/voucherService";
import styles from "./VoucherForm.module.scss";

const cx = classNames.bind(styles);

// Trường hiển thị theo type
const TYPE_FIELDS = {
  NEW_CUSTOMER: [
    "discount_percent",
    "max_discount_amount",
    "min_invoice_amount",
    "valid_days",
  ],
  POINTS_EXCHANGE: [
    "discount_amount",
    "min_invoice_amount",
    "valid_days",
    "points_required",
    "max_usage_per_customer",
  ],
  RETENTION: [
    "discount_percent",
    "max_discount_amount",
    "min_invoice_amount",
    "valid_days",
    "max_usage_per_customer",
  ],
  CAMPAIGN: [
    "discount_percent",
    "max_discount_amount",
    "min_invoice_amount",
    "start_date",
    "end_date",
    "total_quantity",
  ],
};

const FIELD_CONFIG = {
  discount_percent: {
    label: "% Giảm giá",
    type: "number",
    placeholder: "20",
    hint: "1–100",
  },
  discount_amount: {
    label: "Số tiền giảm (đ)",
    type: "number",
    placeholder: "50000",
    hint: "Số tiền cố định",
  },
  max_discount_amount: {
    label: "Giảm tối đa (đ)",
    type: "number",
    placeholder: "50000",
  },
  min_invoice_amount: {
    label: "Đơn tối thiểu (đ)",
    type: "number",
    placeholder: "100000",
  },
  valid_days: {
    label: "Số ngày hiệu lực",
    type: "number",
    placeholder: "30",
  },
  points_required: {
    label: "Điểm cần đổi",
    type: "number",
    placeholder: "200",
    hint: "Phải > 0",
  },
  max_usage_per_customer: {
    label: "Lượt dùng tối đa/KH",
    type: "number",
    placeholder: "3",
  },
  start_date: { label: "Ngày bắt đầu", type: "date" },
  end_date: { label: "Ngày kết thúc", type: "date" },
  total_quantity: {
    label: "Số lượng phát",
    type: "number",
    placeholder: "100",
    hint: "Để trống = không giới hạn",
  },
};

const TYPE_OPTIONS = [
  {
    value: "NEW_CUSTOMER",
    label: "🎁 Khách mới",
    desc: "Tự động tặng khi khách đăng ký",
  },
  {
    value: "POINTS_EXCHANGE",
    label: "⭐ Đổi điểm",
    desc: "Khách dùng điểm tích lũy để đổi",
  },
  {
    value: "RETENTION",
    label: "💌 Giữ chân KH",
    desc: "Gửi cho khách lâu chưa quay lại",
  },
  {
    value: "CAMPAIGN",
    label: "🎉 Chiến dịch",
    desc: "Khách thu thập trong thời gian nhất định",
  },
];

const DEFAULT_VALUES = {
  name: "",
  description: "",
  type: "",
  discount_percent: "",
  discount_amount: "",
  max_discount_amount: "",
  min_invoice_amount: "",
  valid_days: "",
  points_required: "",
  max_usage_per_customer: "",
  start_date: "",
  end_date: "",
  total_quantity: "",
};

function VoucherForm({ voucher, onClose, onSuccess }) {
  const { accessToken } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(DEFAULT_VALUES);
  const [unlimitedValidDays, setUnlimitedValidDays] = useState(true);
  const [unlimitedMaxUsage, setUnlimitedMaxUsage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = !!voucher?.id;

  useEffect(() => {
    if (voucher) {
      const hasValidDays =
        voucher.valid_days !== null && voucher.valid_days !== undefined;
      const hasMaxUsage =
        voucher.max_usage_per_customer !== null &&
        voucher.max_usage_per_customer !== undefined;
      setForm({
        name: voucher.name || "",
        description: voucher.description || "",
        type: voucher.type || "",
        discount_percent: voucher.discount_percent || "",
        discount_amount: voucher.discount_amount || "",
        max_discount_amount: voucher.max_discount_amount || "",
        min_invoice_amount: voucher.min_invoice_amount || "",
        valid_days: voucher.valid_days || "",
        points_required: voucher.points_required || "",
        max_usage_per_customer: voucher.max_usage_per_customer || "",
        start_date: voucher.start_date || "",
        end_date: voucher.end_date || "",
        total_quantity: voucher.total_quantity || "",
      });
      setUnlimitedValidDays(!hasValidDays);
      setUnlimitedMaxUsage(!hasMaxUsage);
    } else {
      setForm(DEFAULT_VALUES);
      setUnlimitedValidDays(true);
      setUnlimitedMaxUsage(true);
    }
    setErrors({});
  }, [voucher]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleTypeChange = (type) => {
    setForm((prev) => ({
      ...DEFAULT_VALUES,
      name: prev.name,
      description: prev.description,
      discount_percent: prev.discount_percent,
      discount_amount: prev.discount_amount,
      max_discount_amount: prev.max_discount_amount,
      min_invoice_amount: prev.min_invoice_amount,
      type,
    }));

    setUnlimitedValidDays(true);
    setUnlimitedMaxUsage(true);
    setErrors({});
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Bắt buộc";
    if (!form.type) err.type = "Chọn loại voucher";

    if (form.type === "POINTS_EXCHANGE") {
      if (!form.discount_amount || Number(form.discount_amount) <= 0)
        err.discount_amount = "Phải lớn hơn 0";
    } else {
      if (
        !form.discount_percent ||
        Number(form.discount_percent) <= 0 ||
        Number(form.discount_percent) > 100
      )
        err.discount_percent = "Phải từ 1 đến 100";
      if (!form.max_discount_amount || Number(form.max_discount_amount) <= 0)
        err.max_discount_amount = "Phải lớn hơn 0";
    }

    if (form.min_invoice_amount && Number(form.min_invoice_amount) < 0)
      err.min_invoice_amount = "Phải >= 0";

    if (form.type === "POINTS_EXCHANGE") {
      if (!form.points_required || Number(form.points_required) <= 0)
        err.points_required = "Phải lớn hơn 0";
    }

    if (!unlimitedValidDays) {
      if (!form.valid_days || Number(form.valid_days) <= 0)
        err.valid_days = "Phải lớn hơn 0";
    }

    const hasMaxUsageField = ["POINTS_EXCHANGE", "RETENTION"].includes(
      form.type,
    );
    if (hasMaxUsageField && !unlimitedMaxUsage) {
      if (
        !form.max_usage_per_customer ||
        Number(form.max_usage_per_customer) <= 0
      ) {
        err.max_usage_per_customer = "Phải lớn hơn 0";
      } else if (!Number.isInteger(Number(form.max_usage_per_customer))) {
        err.max_usage_per_customer = "Phải là số nguyên";
      }
    }

    if (form.type === "CAMPAIGN") {
      if (!form.start_date) err.start_date = "Bắt buộc";
      if (!form.end_date) err.end_date = "Bắt buộc";
      if (form.start_date && form.end_date && form.start_date >= form.end_date)
        err.end_date = "Phải sau ngày bắt đầu";
    }

    return err;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type,
      min_invoice_amount: form.min_invoice_amount
        ? Number(form.min_invoice_amount)
        : 0,
    };

    if (form.type === "POINTS_EXCHANGE") {
      payload.discount_amount = Number(form.discount_amount);
    } else {
      payload.discount_percent = Number(form.discount_percent);
      payload.max_discount_amount = Number(form.max_discount_amount);
    }

    if (form.type !== "CAMPAIGN") {
      payload.valid_days = unlimitedValidDays
        ? null
        : form.valid_days
          ? Number(form.valid_days)
          : null;
    }

    if (form.type === "POINTS_EXCHANGE") {
      payload.points_required = Number(form.points_required);
    }

    if (["POINTS_EXCHANGE", "RETENTION"].includes(form.type)) {
      payload.max_usage_per_customer = unlimitedMaxUsage
        ? null
        : form.max_usage_per_customer
          ? Number(form.max_usage_per_customer)
          : null;
    }

    if (form.type === "CAMPAIGN") {
      payload.start_date = form.start_date;
      payload.end_date = form.end_date;
      payload.total_quantity = form.total_quantity
        ? Number(form.total_quantity)
        : null;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateVoucher(accessToken, voucher.id, payload);
        showToast({
          text: "Cập nhật voucher thành công!",
          type: "success",
          duration: 3000,
        });
      } else {
        await createVoucher(accessToken, payload);
        showToast({
          text: "Tạo voucher thành công!",
          type: "success",
          duration: 3000,
        });
      }
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || "Có lỗi xảy ra!";
      showToast({ text: msg, type: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const activeFields = form.type ? TYPE_FIELDS[form.type] : [];

  const renderField = (key) => {
    const cfg = FIELD_CONFIG[key];
    if (!cfg) return null;
    return (
      <div key={key} className={cx("field", { error: !!errors[key] })}>
        <label className={cx("field-label")}>{cfg.label}</label>
        <input
          type={cfg.type}
          className={cx("field-input")}
          placeholder={cfg.placeholder || ""}
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          min={cfg.type === "number" ? "0" : undefined}
        />
        {cfg.hint && !errors[key] && (
          <span className={cx("field-hint")}>{cfg.hint}</span>
        )}
        {errors[key] && (
          <span className={cx("field-error")}>{errors[key]}</span>
        )}
      </div>
    );
  };

  const renderValidDaysCheckbox = () => {
    if (!activeFields.includes("valid_days")) return null;
    const isRetention = form.type === "RETENTION";
    return (
      <div className={cx("checkbox-group")}>
        <label className={cx("checkbox-label")}>
          <input
            type="checkbox"
            checked={unlimitedValidDays}
            onChange={(e) => setUnlimitedValidDays(e.target.checked)}
          />
          <span>Không giới hạn số ngày</span>
        </label>
      </div>
    );
  };

  const renderMaxUsageCheckbox = () => {
    if (!activeFields.includes("max_usage_per_customer")) return null;
    return (
      <div className={cx("checkbox-group")}>
        <label className={cx("checkbox-label")}>
          <input
            type="checkbox"
            checked={unlimitedMaxUsage}
            onChange={(e) => setUnlimitedMaxUsage(e.target.checked)}
          />
          <span>Không giới hạn lượt/KH</span>
        </label>
      </div>
    );
  };

  return (
    <div className={cx("overlay")} onClick={onClose}>
      <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
        <div className={cx("modal-header")}>
          <h3>{isEdit ? "Chỉnh sửa Voucher" : "Tạo Voucher mới"}</h3>
          <button className={cx("close-btn")} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className={cx("modal-body")}>
          {/* Thông tin cơ bản */}
          <div className={cx("section")}>
            <div className={cx("section-title")}>Thông tin cơ bản</div>
            <div className={cx("field", { error: !!errors.name })}>
              <label className={cx("field-label")}>Tên voucher</label>
              <input
                type="text"
                className={cx("field-input")}
                placeholder="VD: Ưu đãi chào hè 2025"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              {errors.name && (
                <span className={cx("field-error")}>{errors.name}</span>
              )}
            </div>
            <div className={cx("field")}>
              <label className={cx("field-label")}>
                Mô tả <span className={cx("optional")}>(tuỳ chọn)</span>
              </label>
              <input
                type="text"
                className={cx("field-input")}
                placeholder="Mô tả ngắn về voucher..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>

          {/* Chọn type */}
          <div className={cx("section")}>
            <div className={cx("section-title")}>
              Loại voucher
              {errors.type && (
                <span className={cx("field-error", "inline")}>
                  {errors.type}
                </span>
              )}
            </div>
            <div className={cx("type-grid")}>
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cx("type-option", {
                    selected: form.type === opt.value,
                  })}
                  onClick={() => !isEdit && handleTypeChange(opt.value)}
                  disabled={isEdit}
                  title={isEdit ? "Không thể đổi loại khi chỉnh sửa" : ""}
                >
                  <span className={cx("type-option-label")}>{opt.label}</span>
                  <span className={cx("type-option-desc")}>{opt.desc}</span>
                </button>
              ))}
            </div>
            {isEdit && (
              <p className={cx("type-locked-note")}>
                ⚠️ Loại voucher không thể thay đổi sau khi tạo
              </p>
            )}
          </div>

          {/* Fields theo type */}
          {form.type && (
            <div className={cx("section")}>
              <div className={cx("section-title")}>Điều kiện & Giá trị</div>

              <div className={cx("field-row")}>
                {form.type === "POINTS_EXCHANGE"
                  ? renderField("discount_amount")
                  : renderField("discount_percent")}
                {form.type !== "POINTS_EXCHANGE" &&
                  renderField("max_discount_amount")}
                {renderField("min_invoice_amount")}
              </div>

              {form.type !== "CAMPAIGN" && (
                <div className={cx("form-group-last")}>
                  {activeFields.includes("points_required") &&
                    renderField("points_required")}
                  <div className={cx("checkbox-row")}>
                    {renderValidDaysCheckbox()}
                    {renderMaxUsageCheckbox()}
                  </div>
                  {!unlimitedValidDays && (
                    <div className={cx("sub-field")}>
                      {renderField("valid_days")}
                    </div>
                  )}
                  {!unlimitedMaxUsage && (
                    <div className={cx("sub-field")}>
                      {renderField("max_usage_per_customer")}
                    </div>
                  )}
                </div>
              )}

              {form.type === "CAMPAIGN" && (
                <div className={cx("field-row")}>
                  {renderField("start_date")}
                  {renderField("end_date")}
                  {renderField("total_quantity")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={cx("modal-footer")}>
          <button
            className={cx("btn-cancel")}
            onClick={onClose}
            disabled={loading}
          >
            Huỷ
          </button>
          <button
            className={cx("btn-submit")}
            onClick={handleSubmit}
            disabled={loading || !form.type}
          >
            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoucherForm;

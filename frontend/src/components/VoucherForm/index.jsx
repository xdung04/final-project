import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./VoucherForm.module.scss";
import { VoucherAPI } from "~/apis/voucherAPI";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);

function VoucherForm({ voucher, onClose, onVoucherCreated, onVoucherUpdated }) {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [pointCost, setPointCost] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (voucher) {
      setTitle(voucher.title || "");
      setDiscountPercent(voucher.discountPercent || "");
      setPointCost(voucher.pointCost || "");
      setTotalQuantity(voucher.totalQuantity || "");
      setExpiryDate(voucher.expiryDate?.split("T")[0] || "");
      setDescription(voucher.description || "");
    } else {
      setTitle("");
      setDiscountPercent("");
      setPointCost("");
      setTotalQuantity("");
      setExpiryDate("");
      setDescription("");
    }
  }, [voucher]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      title,
      discountPercent: Number(discountPercent),
      pointCost: Number(pointCost),
      totalQuantity: totalQuantity ? Number(totalQuantity) : null,
      expiryDate,
      description,
    };

    setLoading(true);
    try {
      let res;
      if (voucher?.idVoucher) {
        // Edit
        res = await VoucherAPI.update(voucher.idVoucher, data);
        if (res.success) {
          showToast({ text: "Cập nhật voucher thành công!", type: "success" });
          onVoucherUpdated?.();
          onClose();
        } else {
          showToast({ text: "Cập nhật thất bại: " + res.message, type: "error" });
        }
      } else {
        // Create
        res = await VoucherAPI.create(data);
        if (res.success) {
          showToast({ text: "Tạo voucher thành công!", type: "success" });
          onVoucherCreated?.();
          onClose();
        } else {
          showToast({ text: "Tạo voucher thất bại: " + res.message, type: "error" });
        }
      }
    } catch (err) {
      showToast({ text: "Lỗi API: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx("voucherFormOverlay")}>
      <form className={cx("voucherForm")} onSubmit={handleSubmit}>
  <h3>{voucher?.idVoucher ? "Cập nhật voucher" : "Tạo voucher mới"}</h3>

  <div className={cx("fieldGroup")}>
    <label>Tên voucher</label>
    <input type="text" placeholder="Ví dụ: Giảm giá mùa hè" value={title} onChange={(e) => setTitle(e.target.value)} required />
  </div>

  <div className={cx("inputGrid")}>
    <div className={cx("fieldGroup")}>
      <label>Giảm giá (%)</label>
      <input type="number" placeholder="0" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} min="0" max="100" required />
    </div>
    <div className={cx("fieldGroup")}>
      <label>Điểm đổi</label>
      <input type="number" placeholder="0" value={pointCost} onChange={(e) => setPointCost(e.target.value)} min="0" required />
    </div>
  </div>

  <div className={cx("inputGrid")}>
    <div className={cx("fieldGroup")}>
      <label>Giới hạn số lượng</label>
      <input type="number" placeholder="∞" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} min="0" />
    </div>
    <div className={cx("fieldGroup")}>
      <label>Ngày hết hạn</label>
      <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
    </div>
  </div>

  <div className={cx("fieldGroup")}>
    <label>Mô tả chi tiết</label>
    <input type="text" placeholder="Nhập mô tả ngắn cho voucher..." value={description} onChange={(e) => setDescription(e.target.value)} />
  </div>

  <div className={cx("formButtons")}>
    <button type="button" onClick={onClose} disabled={loading}>
      Hủy
    </button>
    <button type="submit" disabled={loading}>
      {loading ? "Đang xử lý..." : voucher?.idVoucher ? "Cập nhật" : "Tạo ngay"}
    </button>
  </div>
</form>
    </div>
  );
}

export default VoucherForm;

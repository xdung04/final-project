import React, { useState } from "react";
import styles from "./PaymentModal.module.scss";

export default function Step4_Invoice({ data, onBack, onClose, onPaidSuccess }) {
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const { booking = {}, services = [], tip = 0, voucher = null, serviceRating = 0 } = data || {};

  const selectedServices = services.filter((s) => s.selected);
  const totalServicePrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const discount = voucher?.discountPercent ? (totalServicePrice * voucher.discountPercent) / 100 : 0;
  const total = totalServicePrice - discount + tip;

  const formatVND = (num) => num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const payRes = await fetch(`${API_BASE_URL}/bookings/${booking.idBooking || booking.id}/pay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPaid: true,
          total,
          tip,
          services: selectedServices.map((s) => s.id),
        }),
      });

      if (!payRes.ok) throw new Error("Không thể cập nhật trạng thái thanh toán");
      await payRes.json();

      if (booking?.barberId && serviceRating > 0) {
        await fetch(`${API_BASE_URL}/ratings/barber/${booking.barberId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rate: serviceRating }),
        });
      }

      setIsPaid(true);
      alert("✅ Thanh toán thành công!");

      // ✅ Gọi callback reload + đóng modal
      if (onPaidSuccess) onPaidSuccess();
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      alert("❌ Có lỗi xảy ra khi thanh toán!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.invoiceContainer}>
      <div className={styles.invoiceCard}>
        <h2 className={styles.invoiceTitle}>🧾 Hóa đơn thanh toán</h2>

        <div className={styles.section}>
          <h3>Thông tin đặt lịch</h3>
          <p>
            <strong>Khách hàng:</strong> {booking.customer || "—"}
          </p>
          <p>
            <strong>Thợ cắt:</strong> {booking.barber || "—"}
          </p>
          <p>
            <strong>Thời gian:</strong> {booking.time || "—"}
          </p>
          <p>
            <strong>Chi nhánh:</strong> {booking.branch || "—"}
          </p>
        </div>

        <div className={styles.section}>
          <h3>Dịch vụ đã chọn</h3>
          {selectedServices.length > 0 ? (
            <ul className={styles.serviceList}>
              {selectedServices.map((s) => (
                <li key={s.id}>
                  <span>{s.name}</span>
                  <span>{formatVND(s.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Không có dịch vụ nào được chọn</p>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.voucherRow}>
            <span>🎟️ Voucher</span>
            {voucher ? (
              <span>
                {voucher.title} (-{voucher.discountPercent}%)
              </span>
            ) : (
              <span>Không áp dụng</span>
            )}
          </div>

          {discount > 0 && (
            <div className={styles.discountRow}>
              <span>Giảm giá</span>
              <span>-{formatVND(discount)}</span>
            </div>
          )}

          <div className={styles.tipRow}>
            <span>💖 Tiền tip</span>
            <span>{formatVND(tip)}</span>
          </div>

          <div className={styles.totalRow}>
            <span>Tổng cộng</span>
            <strong>{formatVND(total)}</strong>
          </div>
        </div>

        {!isPaid ? (
          <div className={styles.btnGroup}>
            <button onClick={onBack} className={styles.backBtn}>
              ⬅ Quay lại
            </button>
            <button onClick={handleConfirm} className={styles.confirmBtn} disabled={loading}>
              {loading ? "Đang xử lý..." : "💵 Xác nhận thanh toán"}
            </button>
          </div>
        ) : (
          <div className={styles.successBox}>
            ✅ <span>Thanh toán thành công!</span>
          </div>
        )}
      </div>
    </div>
  );
}

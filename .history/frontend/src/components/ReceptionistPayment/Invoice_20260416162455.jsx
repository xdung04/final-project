import React, { useState } from "react";
import styles from "./Invoice.module.scss"; 
import socket from "../../utils/socket";// ✅ Đổi tên import SCSS
  // ← Thêm socket

export default function Step4_Invoice({ data, onBack, onClose, onPaidSuccess }) {
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null); // "vnpay" | "cash"

  const { booking = {}, services = [], tip = 0, voucher = null, serviceRating = 0 } = data || {};

  const selectedServices = services.filter((s) => s.selected);
  const totalServicePrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const discount = voucher?.discountPercent ? (totalServicePrice * voucher.discountPercent) / 100 : 0;
  const total = totalServicePrice - discount + tip;

  const formatVND = (num) => num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // ==================== XỬ LÝ THANH TOÁN ====================
  const handlePayment = async () => {
    if (!selectedMethod || loading) return;
    setLoading(true);

    try {
      if (selectedMethod === "vnpay") {
        // ── GỌI VNPAY SANDBOX ──
        const res = await fetch(`${API_BASE_URL}/payments/vnpay/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.idBooking || booking.id,
            amount: total,
            orderInfo: `Thanh toán hóa đơn #${booking.idBooking || booking.id}`,
          }),
        });

        const { paymentUrl } = await res.json();
        if (paymentUrl) {
          window.open(paymentUrl, "_blank");   // Mở trang VNPay
          // Sau khi thanh toán thành công VNPay sẽ callback → bạn xử lý ở backend
          setIsPaid(true);
          if (onPaidSuccess) onPaidSuccess();
          setTimeout(() => onClose(), 1800);
        }
      } 
      else if (selectedMethod === "cash") {
        // ── GỬI SOCKET CHO LỄ TÂN ──
        socket.emit("customer_choose_cash_payment", {
          bookingId: booking.idBooking || booking.id,
          total,
          tip,
          services: selectedServices.map((s) => s.id),
        });

        setIsPaid(true);
        if (onPaidSuccess) onPaidSuccess();
        setTimeout(() => onClose(), 1800);
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert("❌ Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Decorative blobs */}
      <div className={styles.blobTop} />
      <div className={styles.blobBottom} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.ornament}>
          <span className={styles.ornLine} />
          <span className={styles.ornDiamond} />
          <span className={styles.ornLine} />
        </div>
        <p className={styles.eyebrow}>Hoàn tất dịch vụ</p>
        <h2 className={styles.title}>Hóa đơn của bạn</h2>
        <p className={styles.subtitle}>
          Vui lòng kiểm tra lại thông tin trước khi thanh toán
        </p>
      </div>

      {/* Main Card */}
      <div className={styles.card}>
        <div className={styles.invoiceContent}>
          
          {/* Thông tin đặt lịch */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Thông tin đặt lịch</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Khách hàng</span>
                <span className={styles.infoValue}>{booking.customer || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Thợ cắt</span>
                <span className={styles.infoValue}>{booking.barber || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Thời gian</span>
                <span className={styles.infoValue}>{booking.time || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Chi nhánh</span>
                <span className={styles.infoValue}>{booking.branch || "—"}</span>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Dịch vụ */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Dịch vụ đã chọn</p>
            {selectedServices.length > 0 ? (
              <ul className={styles.serviceList}>
                {selectedServices.map((s) => (
                  <li key={s.id} className={styles.serviceItem}>
                    <span className={styles.serviceName}>{s.name}</span>
                    <span className={styles.servicePrice}>{formatVND(s.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>Không có dịch vụ nào được chọn</p>
            )}
          </div>

          <div className={styles.divider} />

          {/* Phụ phí & Khuyến mãi */}
          <div className={styles.section}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>🎟️ Voucher</span>
              <span className={styles.summaryValue}>
                {voucher ? `${voucher.title} (-${voucher.discountPercent}%)` : "Không áp dụng"}
              </span>
            </div>

            {discount > 0 && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Giảm giá</span>
                <span className={styles.discountValue}>-{formatVND(discount)}</span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>💖 Tiền tip</span>
              <span className={styles.summaryValue}>{formatVND(tip)}</span>
            </div>
          </div>
        </div>

        {/* Vùng tổng tiền & Nút bấm (Luôn nằm ở đáy) */}
        <div className={styles.bottomArea}>
          <div className={styles.totalBox}>
            <span>Tổng thanh toán</span>
            <strong>{formatVND(total)}</strong>
          </div>

          {!isPaid ? (
            <div className={styles.btnGroup}>
              <button onClick={onBack} className={styles.backBtn} disabled={loading}>
                ← Quay lại
              </button>
              <button 
                onClick={handleConfirm} 
                className={styles.nextBtn} 
                disabled={loading || selectedServices.length === 0}
              >
                {loading ? "Đang xử lý..." : "Xác nhận thanh toán →"}
              </button>
            </div>
          ) : (
            <div className={styles.successBox}>
              <span className={styles.successDot}></span>
              <span className={styles.successText}>Đã thanh toán thành công!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import styles from "./Invoice.module.scss";

// --- Import Kiến trúc mới ---
import { PaymentAPI } from "~/apis/paymentApi"; 
import socket from "../../utils/socket"; 

/**
 * Step4_Invoice: Màn hình chốt hóa đơn & thanh toán
 * @param {Object} data - Dữ liệu từ các bước trước (booking, services, tip, voucher)
 * @param {Function} onBack - Quay lại bước trước
 * @param {Function} onClose - Đóng modal/kiosk
 * @param {Function} onPaidSuccess - Callback khi thanh toán thành công
 */
export default function Step4_Invoice({ data, onBack, onClose, onPaidSuccess }) {
  // 1. Quản lý State
  const [selectedMethod, setSelectedMethod] = useState(null); // "VNPAY" | "CASH"
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // 2. Destructure & Tính toán dữ liệu hóa đơn
  const { 
    booking = {}, 
    services = [], 
    tip = 0, 
    voucher = null 
  } = data || {};

  const selectedServices = services.filter((s) => s.selected);
  const totalServicePrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  
  const discount = voucher?.discountPercent 
    ? (totalServicePrice * voucher.discountPercent) / 100 
    : 0;
    
  const total = totalServicePrice - discount + (Number(tip) || 0);

  // 3. Helper format tiền tệ
  const formatVND = (num) => 
    num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // 4. XỬ LÝ THANH TOÁN CHÍNH
  const handlePayment = async () => {
    if (!selectedMethod || loading) return;

    const idBooking = booking.idBooking || booking.id;
    setLoading(true);

    try {
      // Chuẩn bị payload khớp với Backend Service
      const payload = {
        method: selectedMethod, // "VNPAY" hoặc "CASH"
        total: Math.round(total),
        tip: Math.round(tip),
        services: selectedServices.map((s) => s.id),
      };

      // Gọi API qua Service tầng cao
      const response = await PaymentAPI.create(idBooking, payload);

      if (selectedMethod === "VNPAY") {
        // LUỒNG VNPAY: Chuyển hướng sang cổng thanh toán
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          throw new Error("Không lấy được link thanh toán VNPAY");
        }
      } else {
        // LUỒNG TIỀN MẶT (CASH): Báo Socket cho lễ tân & Chốt UI
        socket.emit("customer_choose_cash_payment", {
          idBooking,
          customerName: booking.customer,
          total: payload.total,
          tip: payload.tip
        });

        setIsPaid(true);
        if (onPaidSuccess) onPaidSuccess();
        
        // Tự động đóng sau khi hiện thông báo thành công
        setTimeout(() => onClose(), 2500);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert(`❌ ${error.message || "Có lỗi xảy ra khi thanh toán"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Trang trí Blobs */}
      <div className={styles.blobTop} />
      <div className={styles.blobBottom} />

      {/* Header Hóa đơn */}
      <div className={styles.header}>
        <div className={styles.ornament}>
          <span className={styles.ornLine} />
          <span className={styles.ornDiamond} />
          <span className={styles.ornLine} />
        </div>
        <p className={styles.eyebrow}>Hoàn tất dịch vụ</p>
        <h2 className={styles.title}>Hóa đơn của bạn</h2>
        <p className={styles.subtitle}>Vui lòng kiểm tra lại thông tin trước khi thanh toán</p>
      </div>

      <div className={styles.card}>
        <div className={styles.invoiceContent}>
          
          {/* Section 1: Thông tin khách & thợ */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Thông tin lịch hẹn</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Khách hàng</span>
                <span className={styles.infoValue}>{booking.customer || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Barber</span>
                <span className={styles.infoValue}>{booking.barber || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Thời gian</span>
                <span className={styles.infoValue}>{booking.time || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Cơ sở</span>
                <span className={styles.infoValue}>{booking.branch || "—"}</span>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Section 2: Danh sách dịch vụ */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Chi tiết dịch vụ</p>
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
              <p className={styles.empty}>Chưa có dịch vụ nào được chọn</p>
            )}
          </div>

          <div className={styles.divider} />

          {/* Section 3: Voucher & Tip */}
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
              <span className={styles.summaryLabel}>💖 Tiền Tip (Barber)</span>
              <span className={styles.summaryValue}>{formatVND(tip)}</span>
            </div>
          </div>

          {/* Section 4: Lựa chọn Phương thức Thanh toán */}
          {!isPaid && (
            <div className={styles.paymentSection}>
              <p className={styles.sectionTitle}>Phương thức thanh toán</p>
              <div className={styles.paymentOptions}>
                {/* Option VNPAY */}
                <div
                  className={`${styles.paymentOption} ${selectedMethod === "VNPAY" ? styles.active : ""}`}
                  onClick={() => setSelectedMethod("VNPAY")}
                >
                  <div className={styles.methodIcon}>💳</div>
                  <div className={styles.methodInfo}>
                    <strong>VNPay (QR Code)</strong>
                    <p>Quét mã qua App Ngân hàng</p>
                  </div>
                  {selectedMethod === "VNPAY" && <span className={styles.checkMark}>✓</span>}
                </div>

                {/* Option CASH */}
                <div
                  className={`${styles.paymentOption} ${selectedMethod === "CASH" ? styles.active : ""}`}
                  onClick={() => setSelectedMethod("CASH")}
                >
                  <div className={styles.methodIcon}>💵</div>
                  <div className={styles.methodInfo}>
                    <strong>Tiền mặt</strong>
                    <p>Thanh toán trực tiếp tại quầy</p>
                  </div>
                  {selectedMethod === "CASH" && <span className={styles.checkMark}>✓</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Area: Tổng tiền & Nút bấm */}
        <div className={styles.bottomArea}>
          <div className={styles.totalBox}>
            <span className={styles.totalLabel}>Tổng cộng hóa đơn</span>
            <strong className={styles.totalAmount}>{formatVND(total)}</strong>
          </div>

          {!isPaid ? (
            <div className={styles.btnGroup}>
              <button 
                onClick={onBack} 
                className={styles.backBtn} 
                disabled={loading}
              >
                ← Quay lại
              </button>
              <button
                onClick={handlePayment}
                className={styles.nextBtn}
                disabled={loading || !selectedMethod}
              >
                {loading ? "Đang xử lý..." : "Xác nhận & Thanh toán"}
              </button>
            </div>
          ) : (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>🎉</div>
              <div className={styles.successContent}>
                <p className={styles.successText}>
                  {selectedMethod === "CASH" 
                    ? "Yêu cầu thanh toán tiền mặt đã được gửi!" 
                    : "Giao dịch thành công!"}
                </p>
                <small>Hệ thống sẽ quay về trang chủ sau giây lát...</small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
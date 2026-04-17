// File: src/components/ReceptionistPayment/index.jsx
import React, { useState, useEffect } from "react";
import styles from "./PaymentModal.module.scss"; 
import monitorStyles from "./MonitoringView.module.scss"; // Bạn vẫn nên để file SCSS riêng cho đẹp
import Step1_BookingInfo from "./BookingInfo";
import socket from "../../utils/socket";

// --- COMPONENT PHỤ: MONITOR VIEW (Viết ngay trong file này) ---
// --- COMPONENT PHỤ: MONITOR VIEW (đồng bộ style) ---
const MonitoringView = ({ guestProgress, onCancel, onCashPayment }) => {
  const getStepText = (step) => {
    const steps = {
      2: "Khách đang đánh giá dịch vụ...",
      3: "Khách đang chọn tiền Tip...",
      4: "Khách đang kiểm tra hóa đơn...",
      5: "Khách đang thực hiện chuyển khoản...",
    };
    return steps[step] || "Đang chờ khách thao tác...";
  };

  return (
    <div className={monitorStyles.monitoringContent}>
      <div className={monitorStyles.statusBadge}>
        <div className={monitorStyles.pulseDot}></div>
        <span>{getStepText(guestProgress.step)}</span>
      </div>

      <div className={monitorStyles.liveStats}>
        <div className={monitorStyles.statItem}>
          <label>Đánh giá</label>
          <span className={monitorStyles.stars}>
            {guestProgress.rating > 0 ? "⭐".repeat(guestProgress.rating) : "Chưa có"}
          </span>
        </div>
        <div className={monitorStyles.statItem}>
          <label>Tiền Tip</label>
          <span className={monitorStyles.value}>
            {guestProgress.tip > 0 ? `${guestProgress.tip.toLocaleString("vi-VN")}đ` : "0đ"}
          </span>
        </div>
      </div>

      <div className={monitorStyles.actionGroup}>
        <button onClick={onCancel} className={monitorStyles.btnCancel}>
          ✕ Hủy &amp; Rút bill về
        </button>
        <button onClick={onCashPayment} className={monitorStyles.btnCash}>
          💵 Thu tiền mặt &amp; Hoàn tất
        </button>
      </div>
    </div>
  );
};
// --- COMPONENT CHÍNH ---
export default function ReceptionistPayment({ booking, onClose, onPushSuccess }) {
  const [formData, setFormData] = useState(null);
  const [mode, setMode] = useState("EDIT"); // "EDIT" hoặc "MONITOR"
  const [guestProgress, setGuestProgress] = useState({ step: 1, rating: 0, tip: 0 });

  useEffect(() => {
    if (!booking) return;

    // Khởi tạo data từ props booking
    const initialData = {
      booking: {
        idBooking: booking.idBooking || booking.id,
        customer: booking.customer?.name || "Khách lẻ",
        barber: booking.barber?.name || "Chưa chỉ định",
        time: booking.bookingTime || "Không rõ",
        branch: booking.branch?.name || "",
        barberId: booking.barber?.idBarber || booking.barber?.id,
        idVoucher: booking.idVoucher || null,
      },
      services: booking.services?.map((s) => ({
        id: s.idService || s.id,
        name: s.name,
        price: parseFloat(s.price) || 0,
        selected: true,
      })) || [],
      voucher: null,
      serviceRating: 0,
      tip: booking.tip || 0,
      note: booking.description || "",
    };
    setFormData(initialData);

    // Lắng nghe tiến độ từ iPad
    socket.on("receive_customer_progress", (data) => {
      setGuestProgress(data);
    });

    return () => socket.off("receive_customer_progress");
  }, [booking]);

  const handlePushToKiosk = (finalDataFromStep1) => {
    socket.emit("admin_push_checkout", { 
      bookingId: finalDataFromStep1.booking.idBooking,
      formData: finalDataFromStep1 
    });
    setMode("MONITOR"); // Chuyển màn hình
  };

  const handleCancelMonitoring = () => {
    socket.emit("admin_cancel_checkout", { bookingId: formData.booking.idBooking });
    setMode("EDIT");
  };

  const handleCashPayment = () => {
    // Thu tiền mặt xong thì báo cho component cha load lại data
    if (onPushSuccess) onPushSuccess();
    onClose();
  };

  if (!formData) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {mode === "EDIT" && (
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        )}
        
        {mode === "EDIT" ? (
          <Step1_BookingInfo 
            data={formData} 
            setData={setFormData} 
            onNext={handlePushToKiosk} 
          />
        ) : (
          <MonitoringView 
            guestProgress={guestProgress} 
            onCancel={handleCancelMonitoring}
            onCashPayment={handleCashPayment}
          />
        )}
      </div>
    </div>
  );
}
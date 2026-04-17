// File: src/components/ReceptionistPayment.jsx
import React, { useState, useEffect } from "react";
import styles from "./PaymentModal.module.scss"; 
import Step1_BookingInfo from "./BookingInfo";
import socket from "../../utils/socket";

// Component con: Giao diện theo dõi khách hàng
const MonitoringView = ({ guestProgress, onCancel, onCashPayment }) => {
  const getStepText = (step) => {
    switch(step) {
      case 2: return "Khách đang đánh giá dịch vụ...";
      case 3: return "Khách đang chọn tiền Tip...";
      case 4: return "Khách đang kiểm tra hóa đơn...";
      case 5: return "Khách đang thanh toán VNPAY...";
      default: return "Đang chờ khách thao tác...";
    }
  };

  return (
    <div className={styles.monitoringContent}>
      <div className={styles.statusBadge}>
        <div className={styles.pulseDot}></div>
        <span>{getStepText(guestProgress.step)}</span>
      </div>

      <div className={styles.liveStats}>
        <div className={styles.statItem}>
          <label>Đánh giá:</label>
          <span className={styles.stars}>{"⭐".repeat(guestProgress.rating || 0)}</span>
        </div>
        <div className={styles.statItem}>
          <label>Tiền Tip:</label>
          <span className={styles.value}>{guestProgress.tip?.toLocaleString("vi-VN")} đ</span>
        </div>
      </div>

      <div className={styles.actionGroup}>
        <button onClick={onCashPayment} className={styles.btnCash}>
          💵 Thu tiền mặt / Hoàn tất
        </button>
        <button onClick={onCancel} className={styles.btnCancel}>
          ✕ Hủy / Quay lại sửa bill
        </button>
      </div>
    </div>
  );
};

export default function ReceptionistPayment({ booking, onClose, onPushSuccess }) {
  const [formData, setFormData] = useState(null);
  const [mode, setMode] = useState("EDIT"); // 'EDIT' hoặc 'MONITOR'
  const [guestProgress, setGuestProgress] = useState({ step: 2, rating: 0, tip: 0 });

  useEffect(() => {
    if (!booking) return;

    // Khởi tạo dữ liệu ban đầu
    setFormData({
      booking: {
        idBooking: booking.idBooking || booking.id,
        customer: booking.customer?.name || "Khách lẻ",
        barber: booking.barber?.name || "Chưa chỉ định",
        time: booking.bookingTime || "Không rõ",
        branch: booking.branch?.name || "",
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
    });

    // Lắng nghe Socket: Khách hàng cập nhật tiến trình trên iPad
    socket.on("receive_customer_progress", (data) => {
      setGuestProgress(data);
    });

    // Lắng nghe Socket: Khách đã thanh toán VNPAY thành công (Webhook báo về)
    socket.on("payment_success_confirmed", () => {
      alert("🎉 KHÁCH ĐÃ CHUYỂN KHOẢN THÀNH CÔNG!");
      if (onPushSuccess) onPushSuccess();
      onClose();
    });

    return () => {
      socket.off("receive_customer_progress");
      socket.off("payment_success_confirmed");
    };
  }, [booking]);

  const handlePushToKiosk = () => {
    // Bắn dữ liệu sang iPad
    socket.emit("admin_push_checkout", { 
      bookingId: formData.booking.idBooking,
      formData: formData 
    });
    setMode("MONITOR"); // Chuyển sang màn hình hóng hớt
  };

  const handleCancelMonitoring = () => {
    // Báo cho iPad biết là Admin đã hủy yêu cầu
    socket.emit("admin_cancel_checkout", { bookingId: formData.booking.idBooking });
    setMode("EDIT"); // Quay lại màn hình sửa bill
  };

  const handleCashPayment = async () => {
    // Xử lý gọi API cập nhật Database thành "Đã thanh toán" ở đây...
    alert("Đã ghi nhận thanh toán tiền mặt!");
    if (onPushSuccess) onPushSuccess();
    onClose();
  };

  if (!formData) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{mode === "EDIT" ? "Kiểm tra hóa đơn" : "Giám sát khách hàng"}</h3>
          {mode === "EDIT" && <button className={styles.closeBtn} onClick={onClose}>✕</button>}
        </div>
        
        <div className={styles.modalBody}>
          {mode === "EDIT" ? (
            <Step1_BookingInfo 
              data={formData} 
              setData={setFormData} 
              onNext={handlePushToKiosk} // Đổi nút Next thành bắn Socket
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
    </div>
  );
}
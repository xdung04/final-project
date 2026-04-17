// File: src/components/ReceptionistPayment.jsx
import React, { useState, useEffect } from "react";
import styles from "./PaymentModal.module.scss"; 
import Step1_BookingInfo from "./BookingInfo";
import socket from "../../utils/socket";

// 👉 THÊM COMPONENT MONITORING VIEW VÀO ĐÂY
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
    <div style={{ padding: "40px", textAlign: "center" }}>
      {/* Bạn có thể chuyển CSS này vào file module.scss sau cho đẹp */}
      <div style={{ background: "#fff4e5", color: "#ff9800", padding: "10px 20px", borderRadius: "20px", display: "inline-block", fontWeight: "bold", marginBottom: "30px" }}>
        🟡 {getStepText(guestProgress.step)}
      </div>

      <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "20px", marginBottom: "30px", fontSize: "1.2rem", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span>Đánh giá:</span>
          <span>{"⭐".repeat(guestProgress.rating || 0)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Tiền Tip:</span>
          <strong style={{ color: "#2ecc71" }}>{guestProgress.tip?.toLocaleString("vi-VN")}đ</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
        <button 
          onClick={onCancel} 
          style={{ padding: "12px 20px", background: "#e74c3c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          ✕ Hủy / Rút Bill về
        </button>
        <button 
          onClick={onCashPayment} 
          style={{ padding: "12px 20px", background: "#2ecc71", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          💵 Thu tiền mặt / Hoàn tất
        </button>
      </div>
    </div>
  );
};


export default function ReceptionistPayment({ booking, onClose, onPushSuccess }) {
  const [formData, setFormData] = useState(null);
  
  // 👉 1. THÊM STATE ĐỂ QUẢN LÝ CHUYỂN MÀN HÌNH
  const [mode, setMode] = useState("EDIT"); // "EDIT" (sửa bill) hoặc "MONITOR" (hóng hớt)
  const [guestProgress, setGuestProgress] = useState({ step: 2, rating: 0, tip: 0 });

  useEffect(() => {
    if (!booking) return;

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

    // Lắng nghe iPad báo cáo tiến độ
    socket.on("receive_customer_progress", (data) => {
      setGuestProgress(data);
    });

    return () => {
      socket.off("receive_customer_progress");
    };
  }, [booking]);

  // 👉 2. XỬ LÝ KHI BẤM NÚT "Xác nhận & Gửi tới Kiosk"
  const handlePushToKiosk = () => {
    socket.emit("admin_push_checkout", { 
      bookingId: formData.booking.idBooking,
      formData: formData
    });
    
    // Đổi giao diện sang chế độ chờ iPad
    setMode("MONITOR"); 
    
    // ❌ QUAN TRỌNG: KHÔNG GỌI onPushSuccess() Ở ĐÂY NỮA VÌ NÓ SẼ ĐÓNG MODAL!
  };

  // 👉 3. XỬ LÝ KHI BẤM "HỦY / RÚT BILL VỀ"
  const handleCancelMonitoring = () => {
    socket.emit("admin_cancel_checkout", { bookingId: formData.booking.idBooking });
    setMode("EDIT"); // Trả lại màn hình Step1_BookingInfo
  };

  // 👉 4. XỬ LÝ KHI BẤM "THU TIỀN MẶT"
  const handleCashPayment = () => {
    // Gọi API cập nhật trạng thái thanh toán ở Backend tại đây...
    
    // Sau khi thu tiền xong mới gọi onPushSuccess để đóng Modal / Tải lại danh sách
    if (onPushSuccess) onPushSuccess();
    onClose();
  };

  if (!formData) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Chỉ hiện nút X đóng modal khi đang ở chế độ sửa Bill */}
        {mode === "EDIT" && (
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        )}
        
        {/* TÙY THEO STATE MÀ RENDER MÀN HÌNH TƯƠNG ỨNG */}
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
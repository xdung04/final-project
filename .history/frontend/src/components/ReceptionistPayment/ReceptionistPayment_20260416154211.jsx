// File: src/components/ReceptionistPayment.jsx
import React, { useState, useEffect } from "react";
import styles from "./PaymentModal.module.scss"; 
import Step1_BookingInfo from "./BookingInfo";
import socket from "../../utils/socket";
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
          <span className={styles.stars}>
            {guestProgress.rating > 0 ? "⭐".repeat(guestProgress.rating) : "Chưa chọn"}
          </span>
        </div>
        <div className={styles.statItem}>
          <label>Tiền Tip:</label>
          <span className={styles.value}>
            {guestProgress.tip > 0 ? `${guestProgress.tip.toLocaleString("vi-VN")} đ` : "0 đ"}
          </span>
        </div>
      </div>

      <div className={styles.actionGroup}>
        <button onClick={onCancel} className={styles.btnCancel}>
          ✕ Hủy / Rút Bill về
        </button>
        <button onClick={onCashPayment} className={styles.btnCash}>
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
// 👉 2. XỬ LÝ KHI BẤM NÚT "Xác nhận & Gửi tới Kiosk"
  const handlePushToKiosk = (finalData) => {
    // Dùng try...catch để ngăn lỗi làm sập luồng code
    try {
      console.log("🚀 Đang đẩy dữ liệu sang Kiosk:", finalData);

      if (!socket) {
         alert("Lỗi: Không tìm thấy kết nối Socket!");
         return;
      }

      socket.emit("admin_push_checkout", { 
        bookingId: finalData.booking.idBooking,
        formData: finalData// Gửi bản data đã có 'total'
      });
      
      // Đổi giao diện sang chế độ chờ iPad
      setMode("MONITOR"); 
      console.log("✅ Đã chuyển sang màn hình Monitor!");

    } catch (error) {
      console.error("❌ Lỗi khi gửi sang Kiosk:", error);
      alert("Đã xảy ra lỗi khi kết nối với iPad, vui lòng mở F12 xem chi tiết.");
    }
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
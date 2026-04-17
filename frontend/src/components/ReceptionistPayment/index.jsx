// File: src/components/ReceptionistPayment/index.jsx
import React, { useState, useEffect } from "react";
import styles from "./PaymentModal.module.scss"; 
import monitorStyles from "./MonitoringView.module.scss";
import Step1_BookingInfo from "./BookingInfo";
import socket from "../../utils/socket";

// --- COMPONENT PHỤ: MONITOR VIEW (ĐÃ TỐI ƯU) ---
const MonitoringView = ({ guestProgress, onCancel, onCashPayment }) => {
  
  // Hàm xử lý text trạng thái thông minh
  const getStatusInfo = (progress) => {
    if (progress.isPaid) {
      return {
        text: "✅ KHÁCH ĐÃ THANH TOÁN THÀNH CÔNG!",
        className: monitorStyles.statusSuccess, // Ông thêm class này trong CSS màu xanh lá
        isDone: true
      };
    }

    const steps = {
      2: { text: "Khách đang đánh giá dịch vụ...", className: "" },
      3: { text: "Khách đang chọn tiền Tip...", className: "" },
      4: { text: "Khách đang kiểm tra hóa đơn...", className: "" },
      5: { text: "Khách đang thực hiện chuyển khoản...", className: monitorStyles.statusWarning },
      6: { text: "Khách yêu cầu thanh toán TIỀN MẶT", className: monitorStyles.statusAlert },
    };

    return steps[progress.step] || { text: "Đang chờ khách thao tác...", className: "" };
  };

  const status = getStatusInfo(guestProgress);

  return (
    <div className={monitorStyles.monitoringContent}>
      {/* Badge trạng thái đổi màu tùy theo tình huống */}
      <div className={`${monitorStyles.statusBadge} ${status.className}`}>
        {!guestProgress.isPaid && <div className={monitorStyles.pulseDot}></div>}
        <span>{status.text}</span>
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

        {/* Luôn hiển thị tổng tiền nếu có để lễ tân đối soát */}
        <div className={monitorStyles.statItem} style={{ gridColumn: "1 / -1" }}>
          <label>{guestProgress.isPaid ? "Tiền đã nhận (VNPAY)" : "Tổng tiền hóa đơn"}</label>
          <span className={monitorStyles.value} style={{ 
            color: guestProgress.isPaid ? "#22c55e" : "#d4af77", 
            fontSize: "1.6rem" 
          }}>
            {guestProgress.total ? `${guestProgress.total.toLocaleString("vi-VN")}đ` : "—"}
          </span>
        </div>
      </div>

      <div className={monitorStyles.actionGroup}>
        {guestProgress.isPaid ? (
          // Nếu đã trả tiền xong, chỉ hiện 1 nút duy nhất để đóng modal và cập nhật list
          <button onClick={onCashPayment} className={monitorStyles.btnSuccess} style={{ width: '100%' }}>
            Hoàn tất & Lưu hóa đơn
          </button>
        ) : (
          <>
            <button onClick={onCancel} className={monitorStyles.btnCancel}>
              ✕ Hủy & Rút bill
            </button>
            <button onClick={onCashPayment} className={monitorStyles.btnCash}>
              {guestProgress.step === 6 ? "💵 Xác nhận thu tiền mặt" : "💵 Thu tiền mặt"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---
export default function ReceptionistPayment({ booking, onClose, onPushSuccess }) {
  const [formData, setFormData] = useState(null);
  const [mode, setMode] = useState("EDIT");
  const [guestProgress, setGuestProgress] = useState({ 
    step: 1, 
    rating: 0, 
    tip: 0,
    total: 0,
    isPaid: false // Cờ quan trọng
  });

  useEffect(() => {
    if (!booking) return;

    // Reset lại progress mỗi khi mở modal mới
    setGuestProgress({ step: 1, rating: 0, tip: 0, total: 0, isPaid: false });

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

    // LẮNG NGHE TIẾN ĐỘ
    const handleProgress = (data) => {
      console.log("Monitor nhận tín hiệu:", data);
      // Sử dụng hàm callback để đảm bảo merge data không bị mất trường
      setGuestProgress(prev => ({ ...prev, ...data }));
    };

    socket.on("receive_customer_progress", handleProgress);

    // Khi khách chọn tiền mặt
    socket.on("customer_choose_cash_payment", (data) => {
      setGuestProgress(prev => ({
        ...prev,
        ...data,
        step: 6
      }));
    });

    return () => {
      socket.off("receive_customer_progress", handleProgress);
      socket.off("customer_choose_cash_payment");
    };
  }, [booking]);

  const handlePushToKiosk = (finalData) => {
    socket.emit("admin_push_checkout", { 
      bookingId: finalData.booking.idBooking,
      formData: finalData 
    });
    setMode("MONITOR");
  };

  const handleCancelMonitoring = () => {
    socket.emit("admin_cancel_checkout", { bookingId: formData.booking.idBooking });
    setMode("EDIT");
  };

  // Hàm này dùng chung cho cả khi Lễ tân thu tiền mặt HOẶC xác nhận sau khi VNPAY xong
  const handleFinalize = () => {
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
            onCashPayment={handleFinalize}
          />
        )}
      </div>
    </div>
  );
}
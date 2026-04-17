// File: src/components/ReceptionistPayment.jsx
import React, { useState, useEffect } from "react";
import styles from "./PaymentModal.module.scss"; // Tạm thời dùng CSS cũ
import Step1_BookingInfo from "./BookingInfo";// Bỏ dấu ngoặc nhọn đi ông nhé
import socket from "../utils/socket";
export default function ReceptionistPayment({ booking, onClose, onPushSuccess }) {
  const [formData, setFormData] = useState(null);

  // Giữ nguyên logic khởi tạo dữ liệu của bạn
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
  }, [booking]);

  // Hàm xử lý khi Lễ tân bấm "Tiếp tục"
  const handlePushToKiosk = () => {
    // Bắn tín hiệu sang iPad qua Socket
    socket.emit("admin_push_checkout", { 
      bookingId: formData.booking.idBooking,
      formData: formData // Gửi luôn data đã xác nhận sang cho nhanh
    });
    
    // Gọi callback để đóng modal và load lại danh sách
    if (onPushSuccess) onPushSuccess();
  };

  if (!formData) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        {/* CHỈ RENDER BƯỚC 1 */}
        <Step1_BookingInfo 
          data={formData} 
          setData={setFormData} 
          onNext={handlePushToKiosk} // Thay nút Next thành hàm đẩy dữ liệu
        />
      </div>
    </div>
  );
}
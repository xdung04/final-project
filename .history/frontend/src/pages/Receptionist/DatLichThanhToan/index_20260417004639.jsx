import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react"; 
import styles from "./DatLichThanhToan.module.scss";
import BookingList from "~/components/BookingList";
import ReceptionistPayment from "~/components/ReceptionistPayment";
import DirectBooking from "~/components/DirectBooking";
import socket from "~/utils/socket";

export default function PaymentBookingPage() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reloadBookings, setReloadBookings] = useState(() => () => {});
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date) => 
    date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 1);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    if (newDate >= minDate) setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    if (newDate <= maxDate) setSelectedDate(newDate);
  };

  const isToday = new Date().toDateString() === selectedDate.toDateString();
useEffect(() => {
    // Lắng nghe sự kiện thanh toán thành công từ Backend
    socket.on("receive_customer_progress", (data) => {
      // Nếu data báo là đã thanh toán (isPaid) hoặc đến bước thành công (step 5)
      if (data.isPaid || data.step === 5) {
        console.log("Phát hiện thanh toán thành công, đang tải lại danh sách...");
        
        // Gọi hàm reload của BookingList
        if (typeof reloadBookings === 'function') {
          reloadBookings();
        }

        // Nếu đang mở form thanh toán của chính booking đó thì đóng lại luôn cho đẹp
        if (selectedBooking && selectedBooking.id === data.bookingId) {
          setSelectedBooking(null);
        }
      }
    });

    // Cleanup khi component unmount
    return () => {
      socket.off("receive_customer_progress");
    };
  }, [reloadBookings, selectedBooking]);
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        {/* Bộ chọn ngày bên trái */}
        <div className={styles.dateSelector}>
          <button 
            className={styles.arrowButton} 
            onClick={handlePrevDay} 
            disabled={selectedDate <= minDate}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          <div className={styles.dateDisplay}>
            <Calendar size={16} className={styles.calendarIcon} />
            <span>{isToday ? "Hôm nay" : formatDate(selectedDate)}</span>
          </div>

          <button 
            className={styles.arrowButton} 
            onClick={handleNextDay} 
            disabled={selectedDate >= maxDate}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Nút booking bên phải */}
        <button className={styles.bookingButton} onClick={() => setShowBookingForm(true)}>
          <Plus size={18} strokeWidth={2.5} /> 
          <span>Booking Trực Tiếp</span>
        </button>
      </div>

      {/* Danh sách lịch hẹn bên dưới */}
      <div className={styles.container}>
        <BookingList
          date={selectedDate.toISOString().split("T")[0]}
          onSelect={(booking, reloadFunc) => {
            setSelectedBooking(booking);
            setReloadBookings(() => reloadFunc);
          }}
        />

        {selectedBooking && (
          <ReceptionistPayment
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onPushSuccess={() => {
              reloadBookings(); 
              setSelectedBooking(null);
            }}
          />
        )}
      </div>

      {showBookingForm && (
        <DirectBooking
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => {
            reloadBookings(); 
            setShowBookingForm(false);
          }}
        />
      )}
    </div>
  );
}
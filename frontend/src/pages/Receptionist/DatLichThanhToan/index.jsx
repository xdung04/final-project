import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"; // Import thêm icon
import styles from "./DatLichThanhToan.module.scss";
import BookingList from "~/components/BookingList";
import PaymentModal from "~/components/PaymentModal";
import DirectBooking from "~/components/DirectBooking";

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
  maxDate.setDate(maxDate.getDate() + 14); // Tăng lên 14 ngày cho thoải mái

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
            <ChevronLeft size={20} />
          </button>

          <div className={styles.dateDisplay}>
            {isToday ? "Hôm nay" : formatDate(selectedDate)}
          </div>

          <button 
            className={styles.arrowButton} 
            onClick={handleNextDay} 
            disabled={selectedDate >= maxDate}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Nút booking bên phải */}
        <button className={styles.bookingButton} onClick={() => setShowBookingForm(true)}>
          <Plus /> Booking trực tiếp
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
          <PaymentModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onPaidSuccess={() => {
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
import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import styles from "./DatLichThanhToan.module.scss";
import BookingList from "~/components/BookingList";
import ReceptionistPayment from "~/components/ReceptionistPayment";
import DirectBooking from "~/components/DirectBooking";
import socket from "~/utils/socket";

export default function PaymentBookingPage() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Dùng useRef để lưu hàm reload, giúp socket luôn gọi được hàm mới nhất
  const reloadRef = useRef(() => {});

  // Cập nhật ref mỗi khi user chọn một booking hoặc danh sách load lại
  const handleOnSelect = (booking, reloadFunc) => {
    setSelectedBooking(booking);
    reloadRef.current = reloadFunc;
  };

  // Logic xử lý Socket
  useEffect(() => {
    const handlePaymentProgress = (data) => {
      // Log để debug khi test
      console.log("Socket nhận data thanh toán:", data);

      // Nếu khách đã trả tiền (isPaid) hoặc hoàn tất các bước trên iPad (step 5)
      if (data.isPaid || data.step === 5) {
        console.log("♻️ Tự động load lại danh sách lịch hẹn...");
        
        // Gọi hàm reload từ ref
        if (typeof reloadRef.current === "function") {
          reloadRef.current();
        }

        // Nếu lễ tân đang mở chính cái bill đó thì đóng lại cho đồng bộ
        setSelectedBooking((prev) => {
          if (prev && String(prev.id) === String(data.bookingId)) {
            return null;
          }
          return prev;
        });
      }
    };

    socket.on("receive_customer_progress", handlePaymentProgress);

    // Cleanup socket khi chuyển trang hoặc đóng component
    return () => {
      socket.off("receive_customer_progress", handlePaymentProgress);
    };
  }, []);

  // --- Logic xử lý ngày tháng ---
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

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
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

        <button className={styles.bookingButton} onClick={() => setShowBookingForm(true)}>
          <Plus size={18} strokeWidth={2.5} />
          <span>Booking Trực Tiếp</span>
        </button>
      </div>

      <div className={styles.container}>
        <BookingList
          date={selectedDate.toISOString().split("T")[0]}
          onSelect={handleOnSelect}
        />

        {selectedBooking && (
          <ReceptionistPayment
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onPushSuccess={() => {
              // Khi lễ tân chủ động đẩy bill sang iPad
              reloadRef.current();
              setSelectedBooking(null);
            }}
          />
        )}
      </div>

      {showBookingForm && (
        <DirectBooking
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => {
            // Khi tạo mới booking trực tiếp thành công
            reloadRef.current();
            setShowBookingForm(false);
          }}
        />
      )}
    </div>
  );
}
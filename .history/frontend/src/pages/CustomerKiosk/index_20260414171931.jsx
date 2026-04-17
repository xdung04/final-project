// File: src/pages/CustomerKiosk.jsx
import React, { useState, useEffect } from "react";
// Đừng dùng class .overlay hay .modal ở đây nữa, hãy tạo một class full màn hình
import styles from "./CustomerKiosk.module.scss"; 
import Step2_Rating from "~/components/ReceptionistPayment/Rating";
import Step3_Tips from "~/components/ReceptionistPayment/Tips";
import Step4_Invoice from "~/components/ReceptionistPayment/Invoice";
import socket from "../../utils/socket";

function CustomerKiosk() {
  const [step, setStep] = useState(0); // 0 = Màn hình chờ
  const [formData, setFormData] = useState(null);

useEffect(() => {
  // --- CONNECT ---
  socket.on("connect", () => {
    console.log("✅ Kiosk connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket error:", err.message);
  });

  // --- NHẬN DATA ---
  socket.on("receive_checkout_request", (data) => {
    console.log("🔥 Kiosk nhận data:", data);

    // ✅ FIX CHÍNH: build lại formData đúng format
    const formData = {
      booking: {
        idBooking: data.bookingId,
        customer: data.customer?.name || "Khách lẻ",
        barber: data.barber?.name || "Chưa có",
        time: data.bookingTime || "Không rõ",
      },
      services: data.services?.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        selected: true,
      })) || [],
      tip: 0,
      serviceRating: 0,
    };

    setFormData(formData);
    setStep(2); // bắt đầu từ Rating
  });

  return () => {
    socket.off("connect");
    socket.off("connect_error");
    socket.off("receive_checkout_request");
  };
}, []);
  return (
    <div className={styles.fullPage}>
      {/* BỎ BƯỚC 1 ĐI, BẮT ĐẦU TỪ BƯỚC 2 */}
      {step === 2 && <Step2_Rating data={formData} setData={setFormData} onNext={nextStep} />}
      {step === 3 && <Step3_Tips data={formData} setData={setFormData} onNext={nextStep} onBack={prevStep} />}
      {step === 4 && (
        <Step4_Invoice 
          data={formData} 
          onBack={prevStep} 
          onPaidSuccess={() => {
            setStep(0); // Thanh toán xong quay về màn hình chờ
            setFormData(null);
          }} 
        />
      )}
    </div>
  );
}
export default CustomerKiosk;
// File: src/pages/CustomerKiosk.jsx
import React, { useState, useEffect } from "react";
import styles from "./CustomerKiosk.module.scss";

import Step2_Rating from "~/components/ReceptionistPayment/Rating";
import Step3_Tips from "~/components/ReceptionistPayment/Tips";
import Step4_Invoice from "~/components/ReceptionistPayment/Invoice";

import socket from "../../utils/socket";

function CustomerKiosk() {
  const [step, setStep] = useState(0); // 0 = waiting
  const [formData, setFormData] = useState(null);

  // 👉 control step
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  useEffect(() => {
    // ✅ CONNECT
    socket.on("connect", () => {
      console.log("✅ Kiosk connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });

    // ✅ NHẬN DATA TỪ LỄ TÂN
    socket.on("receive_checkout_request", (incomingData) => {
      console.log("🔥 Kiosk nhận incomingData:", incomingData);

      // TUỲ THUỘC VÀO CÁCH LỄ TÂN GỬI (Gửi thẳng hay bọc trong object { formData: ... })
      // Ta lấy ra cục data chuẩn
      const rawData = incomingData.formData ? incomingData.formData : incomingData;

      // 👉 FIX CHÍNH: Kế thừa nguyên vẹn booking, services, voucher từ Lễ tân
      // Chỉ bổ sung thêm tip và serviceRating cho Kiosk
      const newFormData = {
        ...rawData,       // Lấy toàn bộ { booking, services, voucher }
        tip: 0,           // Khởi tạo tiền tip
        serviceRating: 0, // Khởi tạo đánh giá
      };

      console.log("✅ formData chuẩn đã hợp nhất:", newFormData);

      setFormData(newFormData);
      setStep(2); // Bắt đầu từ màn hình Rating
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("receive_checkout_request");
    };
  }, []);

  // 👉 Màn hình chờ
  if (step === 0 || !formData) {
    return (
      <div className={styles.fullPage}>
        <h1>Chào mừng đến BarberSpace</h1>
        <p>Vui lòng đợi trong giây lát...</p>
      </div>
    );
  }

  // 👉 Flow chính
  return (
    <div className={styles.fullPage}>
      {step === 2 && (
        <Step2_Rating
          data={formData}
          setData={setFormData}
          onNext={nextStep}
        />
      )}

      {step === 3 && (
        <Step3_Tips
          data={formData}
          setData={setFormData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {step === 4 && (
        <Step4_Invoice
          data={formData}
          onBack={prevStep}
          onClose={() => {
            console.log("Đóng màn hình");
          }}
          onPaidSuccess={() => {
            console.log("✅ Thanh toán xong → reset kiosk");
            setStep(0);
            setFormData(null);
          }}
        />
      )}
    </div>
  );
}

export default CustomerKiosk;
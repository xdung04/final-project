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
    socket.on("receive_checkout_request", (data) => {
      console.log("🔥 Kiosk nhận data:", data);

      // 👉 ĐIỂM SỬA CHÍNH: Lấy đúng phần 'formData' mà bên Lễ tân gửi sang
      const receivedData = data.formData ? data.formData : data;

      // Giữ nguyên các thông tin (booking, services, voucher) và nhồi thêm tip, rating
      const newFormData = {
        ...receivedData,
        tip: 0,
        serviceRating: 0,
      };

      console.log("✅ formData chuẩn đưa vào màn hình:", newFormData);

      setFormData(newFormData);
      setStep(2); // bắt đầu từ Rating
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
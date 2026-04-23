// File: src/pages/CustomerKiosk.jsx
import React, { useState, useEffect } from "react";
import { Scissors } from "lucide-react"; // Thêm icon cho ngầu
import styles from "./CustomerKiosk.module.scss";

import Step2_Rating from "~/components/ReceptionistPayment/Rating";
import Step3_Tips from "~/components/ReceptionistPayment/Tips";
import Step4_Invoice from "~/components/ReceptionistPayment/Invoice";

import socket from "../../utils/socket";

function CustomerKiosk() {
  const [step, setStep] = useState(0); // 0 = waiting
  const [formData, setFormData] = useState(null);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  useEffect(() => {
    socket.on("connect", () => console.log("✅ Kiosk connected:", socket.id));
    socket.on("connect_error", (err) => console.error("❌ Socket error:", err.message));

    socket.on("receive_checkout_request", (data) => {
      const receivedData = data.formData ? data.formData : data;
      const newFormData = {
        ...receivedData,
        tip: 0,
        serviceRating: 0,
      };
      setFormData(newFormData);
      setStep(2); 
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("receive_checkout_request");
    };
  }, []);

  // 👉 GIAO DIỆN MÀN HÌNH CHỜ LUXURY
// 👉 MÀN HÌNH CHÀO (WELCOME SCREEN) LUXURY
  if (step === 0 || !formData) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.waitingBox}>
          <Scissors className={styles.logoIcon} strokeWidth={1} />
          
          <div className={styles.brandName}>BARBER SHOP</div>
          
          <h1 className={styles.welcomeText}>Xin Chào Quý Khách</h1>
          
          {/* Slogan của cửa hàng */}
          <div className={styles.slogan}>
            “Nâng tầm diện mạo, khơi nguồn tự tin”
          </div>

          <div className={styles.loadingArea}>
            <div className={styles.pulseDot}></div>
            <p>Hệ thống đang sẵn sàng phục vụ...</p>
          </div>
        </div>

        {/* Trang trí thêm góc màn hình cho sang */}
        <div className={styles.cornerDecorTop}></div>
        <div className={styles.cornerDecorBottom}></div>
      </div>
    );
  }

  // 👉 Flow chính
  return (
    <div className={styles.fullPageApp}>
      {step === 2 && <Step2_Rating data={formData} setData={setFormData} onNext={nextStep} />}
      {step === 3 && <Step3_Tips data={formData} setData={setFormData} onNext={nextStep} onBack={prevStep} />}
      {step === 4 && (
        <Step4_Invoice
          data={formData}
          onBack={prevStep}
          onClose={() => console.log("Đóng màn hình")}
          onPaidSuccess={() => {
            setStep(0);
            setFormData(null);
          }}
        />
      )}
    </div>
  );
}

export default CustomerKiosk;
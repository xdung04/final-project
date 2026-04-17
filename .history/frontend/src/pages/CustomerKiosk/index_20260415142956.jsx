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
  if (step === 0 || !formData) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.waitingBox}>
          <Scissors className={styles.logoIcon} strokeWidth={1.5} />
          <h1>BarberSpace</h1>
          <p className={styles.subtitle}>Premium Gentleman's Grooming</p>
          
          <div className={styles.loadingArea}>
            <div className={styles.spinner}></div>
            <p>Vui lòng đợi lễ tân lên đơn...</p>
          </div>
        </div>
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
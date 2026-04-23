// File: src/pages/CustomerKiosk.jsx
import React, { useState, useEffect } from "react";
// Đừng dùng class .overlay hay .modal ở đây nữa, hãy tạo một class full màn hình
import styles from "./CustomerKiosk.module.scss"; 
import Step2_Rating from "~/components/PaymentModal/Rating";
import Step3_Tips from "~/components/PaymentModal/Tips";
import Step4_Invoice from "~/components/PaymentModal/Invoice";
import { socket } from "~/utils/socket";

function CustomerKiosk() {
  const [step, setStep] = useState(0); // 0 = Màn hình chờ
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    // Lắng nghe tín hiệu từ Lễ tân
    socket.on("receive_checkout_request", (data) => {
      setFormData(data.formData); // Nhận data Lễ tân vừa gửi
      setStep(2); // Nhảy thẳng vào Bước 2
    });

    return () => {
      socket.off("receive_checkout_request");
    };
  }, []);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  // Nếu đang rảnh, hiện màn hình chờ
  if (step === 0 || !formData) {
    return (
      <div className={styles.fullPage}>
        <h1>Chào mừng đến BarberSpace. Vui lòng đợi trong giây lát...</h1>
      </div>
    );
  }

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
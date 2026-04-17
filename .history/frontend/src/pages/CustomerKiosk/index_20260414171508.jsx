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
    // --- THÊM PHẦN NÀY ĐỂ TEST KẾT NỐI ---
    socket.on("connect", () => {
      console.log("✅ FRONTEND: Kiosk đã kết nối Socket thành công! ID:", socket.id);
    });
    
    socket.on("connect_error", (err) => {
      console.error("❌ FRONTEND: Lỗi kết nối Socket. Kiểm tra lại cổng!", err.message);
    });
    // ------------------------------------

    // Lắng nghe tín hiệu từ Lễ tân
    socket.on("receive_checkout_request", (data) => {
      console.log("🔥 Kiosk đã nhận tín hiệu đẩy từ Lễ tân:", data); // Thêm log này để chắc chắn có data sang
      setFormData(data.formData); 
      setStep(2); 
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
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
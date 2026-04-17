// File: src/pages/CustomerKiosk.jsx
import React, { useState, useEffect } from "react";
import { Scissors } from "lucide-react";
import styles from "./CustomerKiosk.module.scss";

import Step2_Rating from "~/components/ReceptionistPayment/Rating";
import Step3_Tips from "~/components/ReceptionistPayment/Tips";
import Step4_Invoice from "~/components/ReceptionistPayment/Invoice"; // Ở đây bạn cấu hình 2 nút Tiền mặt & VNPAY như đã thảo luận

import socket from "../../utils/socket";

export default function CustomerKiosk() {
  const [step, setStep] = useState(0); // 0 = waiting
  const [formData, setFormData] = useState(null);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  // Hàm tự động bắn thông tin về cho Lễ tân
  const notifyAdminProgress = (currentFormData, currentStep) => {
    if (!currentFormData || currentStep === 0) return;
    
    socket.emit("customer_update_progress", {
      bookingId: currentFormData.booking.idBooking,
      step: currentStep,
      rating: currentFormData.serviceRating || 0,
      tip: currentFormData.tip || 0,
    });
  };

  // Thiết lập Socket Listeners
  useEffect(() => {
    socket.on("receive_checkout_request", (data) => {
      const receivedData = data.formData ? data.formData : data;
      setFormData({
        ...receivedData,
        tip: 0,
        serviceRating: 0,
      });
      setStep(2); // Nhảy thẳng vào bước đánh giá
    });

    socket.on("receive_cancel_checkout", () => {
      // Admin đã hủy yêu cầu, reset iPad về màn hình chờ
      setStep(0);
      setFormData(null);
    });

    return () => {
      socket.off("receive_checkout_request");
      socket.off("receive_cancel_checkout");
    };
  }, []);

  // Lắng nghe mỗi khi khách hàng tương tác để báo cáo admin
  useEffect(() => {
    notifyAdminProgress(formData, step);
  }, [step, formData?.serviceRating, formData?.tip]);

  // 👉 MÀN HÌNH CHỜ LUXURY (Khi step === 0)
  if (step === 0 || !formData) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.waitingBox}>
          <Scissors className={styles.logoIcon} strokeWidth={1} />
          <div className={styles.brandName}>BARBER SHOP</div>
          <h1 className={styles.welcomeText}>Xin Chào Quý Khách</h1>
          <div className={styles.slogan}>“Nâng tầm diện mạo, khơi nguồn tự tin”</div>
          <div className={styles.loadingArea}>
            <div className={styles.pulseDot}></div>
            <p>Hệ thống đang sẵn sàng phục vụ...</p>
          </div>
        </div>
      </div>
    );
  }

  // 👉 LUỒNG TƯƠNG TÁC CỦA KHÁCH
  return (
    <div className={styles.fullPageApp}>
      {step === 2 && (
        <Step2_Rating data={formData} setData={setFormData} onNext={nextStep} />
      )}
      {step === 3 && (
        <Step3_Tips data={formData} setData={setFormData} onNext={nextStep} onBack={prevStep} />
      )}
      {step === 4 && (
        <Step4_Invoice
          data={formData}
          onBack={prevStep}
          onClose={() => {
            // Đóng hóa đơn và quay về màn hình chờ
            setStep(0);
            setFormData(null);
          }}
        />
      )}
    </div>
  );
}
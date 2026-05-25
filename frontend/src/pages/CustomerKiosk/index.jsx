// File: src/pages/CustomerKiosk.jsx
import React, { useState, useEffect } from "react";
import { Scissors, CheckCircle2 } from "lucide-react"; // Thêm icon check cho đẹp
import { useSearchParams } from "react-router-dom"; // Hook để đọc URL
import styles from "./CustomerKiosk.module.scss";

import Step2_Rating from "~/components/ReceptionistPayment/Rating";
import Step3_Tips from "~/components/ReceptionistPayment/Tips";
import Step4_Invoice from "~/components/ReceptionistPayment/Invoice";
import socket from "../../utils/socket";

export default function CustomerKiosk() {
  const [step, setStep] = useState(0); // 0 = waiting, 5 = thank you
  const [formData, setFormData] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  // --- LOGIC XỬ LÝ SAU KHI VNPAY ĐÁ VỀ ---
  useEffect(() => {
    const responseCode = searchParams.get("vnp_ResponseCode");
    
    if (responseCode === "00") {
      setStep(5); // Chuyển sang step "Cảm ơn" đặc biệt

      // Bộ đếm ngược 5 giây
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      // Sau 5 giây quay về màn hình chờ (Step 0) và dọn sạch URL
      const redirect = setTimeout(() => {
        setStep(0);
        setFormData(null);
        setSearchParams({}); // Xóa các tham số ?vnp_... trên URL
      }, 5000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirect);
      };
    } else if (responseCode && responseCode !== "00") {
        // Nếu thanh toán thất bại, có thể cho quay lại step 4 hoặc hiện lỗi
        alert("Thanh toán không thành công. Vui lòng thử lại!");
        setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    socket.on("receive_checkout_request", (data) => {
      const receivedData = data.formData ? data.formData : data;
      setFormData({
        ...receivedData,
        tip: 0,
        serviceRating: 0,
      });
      setStep(2);
    });

    socket.on("receive_cancel_checkout", () => {
      setStep(0);
      setFormData(null);
    });

    return () => {
      socket.off("receive_checkout_request");
      socket.off("receive_cancel_checkout");
    };
  }, []);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const notifyAdminProgress = (currentFormData, currentStep) => {
    if (!currentFormData || currentStep === 0 || currentStep === 5) return;
    
    socket.emit("customer_update_progress", {
      bookingId: currentFormData.booking.idBooking,
      step: currentStep,
      rating: currentFormData.serviceRating || 0,
      tip: currentFormData.tip || 0,
      total: currentFormData.total || 0,
    });
  };

  useEffect(() => {
    notifyAdminProgress(formData, step);
  }, [step, formData?.serviceRating, formData?.tip]);

  // 👉 MÀN HÌNH CẢM ƠN (Khi thanh toán xong)
  if (step === 5) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.successBox}>
          <CheckCircle2 size={80} color="#22c55e" strokeWidth={1.5} className={styles.pulseIcon} />
          <h1 className={styles.welcomeText} style={{ color: '#22c55e', marginTop: '20px' }}>
            Thanh Toán Thành Công!
          </h1>
          <div className={styles.slogan}>Cảm ơn quý khách đã tin tưởng Barber Shop.</div>
          <div className={styles.loadingArea}>
            <p>Trang sẽ tự động quay lại sau <span className={styles.seconds}>{countdown}s</span></p>
          </div>
        </div>
      </div>
    );
  }

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
            setStep(0);
            setFormData(null);
          }}
        />
      )}
    </div>
  );
}
// File: src/pages/CustomerKiosk.jsx
import React, { useState, useEffect } from "react";
import { Scissors, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
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
  
  // ✅ Lấy idBranch từ URL params hoặc localStorage
  const [idBranch, setIdBranch] = useState(null);
  const [ipadId, setIpadId] = useState(null);

  // ✅ BƯỚC 1: Khởi tạo branch info khi component mount
  useEffect(() => {
    // Cách 1: Từ URL params (nếu có)
    const branchFromUrl = new URLSearchParams(window.location.search).get("idBranch");
    
    
    // Cách 3: Từ environment hoặc config
    const branch = branchFromUrl || process.env.REACT_APP_BRANCH_ID;
    
    if (branch) {
      setIdBranch(Number(branch));
      console.log(`✅ iPad khởi động ở chi nhánh: ${branch}`);
    } else {
      console.warn("⚠️ Không tìm thấy idBranch - iPad sẽ không hoạt động đúng!");
    }

    // Tạo unique ID cho iPad này
    const storedIpadId = localStorage.getItem("ipadId");
    const newIpadId = storedIpadId || `iPad_${Date.now()}`;
    if (!storedIpadId) {
      localStorage.setItem("ipadId", newIpadId);
    }
    setIpadId(newIpadId);
  }, []);

  // ✅ BƯỚC 2: Join room checkout khi idBranch sẵn sàng
  useEffect(() => {
    if (!idBranch || !ipadId) return;

    socket.emit("ipad_join_checkout", {
      idBranch,
      ipadId,
    });

    console.log(`✅ iPad [${ipadId}] joined checkout room for branch [${idBranch}]`);

    return () => {
      console.log(`👋 iPad leaving checkout room`);
    };
  }, [idBranch, ipadId]);

  // --- LOGIC XỬ LÝ SAU KHI VNPAY ĐÁ VỀ ---
  useEffect(() => {
    const responseCode = searchParams.get("vnp_ResponseCode");
    
    if (responseCode === "00") {
      setStep(5);

      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      const redirect = setTimeout(() => {
        setStep(0);
        setFormData(null);
        setSearchParams({});
      }, 5000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirect);
      };
    } else if (responseCode && responseCode !== "00") {
      alert("Thanh toán không thành công. Vui lòng thử lại!");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    // ✅ Nghe receive_checkout_request từ room
    socket.on("receive_checkout_request", (data) => {
      console.log("📱 iPad nhận bill từ lễ tân:", data);
      const receivedData = data.formData ? data.formData : data;
      setFormData({
        ...receivedData,
        tip: 0,
        serviceRating: 0,
      });
      setStep(2);
    });

    socket.on("receive_cancel_checkout", (data) => {
      console.log("❌ Lễ tân hủy bill:", data);
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

  // ✅ FIX: Thêm idBranch vào notify progress
  const notifyAdminProgress = (currentFormData, currentStep) => {
    if (!currentFormData || !idBranch || currentStep === 0 || currentStep === 5) return;
    
    console.log(`📤 Cập nhật tiến độ step ${currentStep} tới lễ tân`);
    socket.emit("customer_update_progress", {
      idBranch,                                    // ✅ Thêm
      bookingId: currentFormData.booking.idBooking,
      step: currentStep,
      rating: currentFormData.serviceRating || 0,
      tip: currentFormData.tip || 0,
      total: currentFormData.total || 0,
      timestamp: new Date().toISOString(),
    });
  };

  useEffect(() => {
    notifyAdminProgress(formData, step);
  }, [step, formData?.serviceRating, formData?.tip, idBranch]);

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

  // 👉 MÀN HÌNH CHỜ (Khi step === 0)
  if (step === 0 || !formData) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.waitingBox}>
          <Scissors className={styles.logoIcon} strokeWidth={1} />
          <div className={styles.brandName}>BARBER SHOP</div>
          <h1 className={styles.welcomeText}>Xin Chào Quý Khách</h1>
          <div className={styles.slogan}>"Nâng tầm diện mạo, khơi nguồn tự tin"</div>
          <div className={styles.loadingArea}>
            <div className={styles.pulseDot}></div>
            <p>Hệ thống đang sẵn sàng phục vụ...</p>
            {/* ✅ Debug: Hiển thị branch info */}
            {process.env.NODE_ENV === "development" && (
              <small style={{ marginTop: "10px", color: "#666" }}>
                Branch: {idBranch || "?"} | iPad: {ipadId || "?"}
              </small>
            )}
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
          // ✅ Pass idBranch để Step4_Invoice có thể dùng
          idBranch={idBranch}
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
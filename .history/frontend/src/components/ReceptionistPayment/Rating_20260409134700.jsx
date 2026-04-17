import React from "react";
import styles from "./PaymentModal.module.scss";

export default function Rating({ data, setData, onNext, onBack }) {
  const { serviceRating } = data;

  const handleSelect = (value) => {
    setData({ ...data, serviceRating: value });
  };

  return (
    <div className={styles.step1Container}>
      <h2 className={styles.title}>💈 Cảm nhận của bạn về dịch vụ</h2>

      <div className={styles.infoBox}>
        <p style={{ fontSize: "15px", color: "#ccc", marginBottom: "18px" }}>
          Hãy chọn khuôn mặt thể hiện cảm xúc của bạn sau khi sử dụng dịch vụ 💬
        </p>

        <div className={styles.faceRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <div
              key={value}
              className={`${styles.face} ${
                serviceRating === value ? styles.activeFace : ""
              }`}
              onClick={() => handleSelect(value)}
            >
              {value === 1 && "😡"}
              {value === 2 && "😕"}
              {value === 3 && "😐"}
              {value === 4 && "😊"}
              {value === 5 && "😍"}
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", color: "#d4a373", marginTop: "10px" }}>
          Mức đánh giá: {serviceRating ? `${serviceRating}/5` : "Chưa chọn"}
        </p>
      </div>

      <div className={styles.btnGroup}>
        <button onClick={onBack} className={styles.backBtn}>
          ⬅ Quay lại
        </button>
        <button onClick={onNext} className={styles.nextBtn}>
          Tiếp tục ➜
        </button>
      </div>
    </div>
  );
}

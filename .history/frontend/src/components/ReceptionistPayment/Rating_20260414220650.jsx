import React from "react";
import styles from "./Rating.module.scss"; // 👉 Import file SCSS mới

export default function Rating({ data, setData, onNext, onBack }) {
  const { serviceRating } = data;

  const handleSelect = (value) => {
    setData({ ...data, serviceRating: value });
  };

  // Định nghĩa nhãn text cho từng mức độ để nhìn chuyên nghiệp hơn
  const ratingLabels = {
    1: "Rất tệ",
    2: "Chưa tốt",
    3: "Bình thường",
    4: "Hài lòng",
    5: "Tuyệt vời",
  };

  const faces = [
    { val: 1, emoji: "😡" },
    { val: 2, emoji: "😕" },
    { val: 3, emoji: "😐" },
    { val: 4, emoji: "😊" },
    { val: 5, emoji: "😍" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Cảm nhận dịch vụ</h2>
        <p className={styles.subtitle}>
          Sự hài lòng của bạn là thước đo chất lượng của chúng tôi
        </p>
      </div>

      <div className={styles.ratingBox}>
        <div className={styles.faceRow}>
          {faces.map((item) => (
            <div
              key={item.val}
              className={`${styles.faceItem} ${
                serviceRating === item.val ? styles.activeFace : ""
              }`}
              onClick={() => handleSelect(item.val)}
            >
              <div className={styles.emoji}>{item.emoji}</div>
              <span className={styles.label}>{ratingLabels[item.val]}</span>
            </div>
          ))}
        </div>

        <div className={styles.statusText}>
          {serviceRating ? (
            <span>
              Mức đánh giá: <strong>{ratingLabels[serviceRating]}</strong>
            </span>
          ) : (
            <span className={styles.hint}>* Vui lòng chạm để chọn mức độ hài lòng</span>
          )}
        </div>
      </div>

      <div className={styles.btnGroup}>
        <button onClick={onBack} className={styles.backBtn}>
          Quay lại
        </button>
        <button 
          onClick={onNext} 
         className={styles.nextBtn}
          disabled={!serviceRating} // Bắt buộc khách chọn mới cho đi tiếp
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
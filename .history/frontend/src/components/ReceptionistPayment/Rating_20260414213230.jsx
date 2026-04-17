import React from "react";
import styles from "./Rating.module.scss"; 

export default function Rating({ data, setData, onNext, onBack }) {
  const { serviceRating } = data;

  const handleSelect = (value) => {
    setData({ ...data, serviceRating: value });
  };

  // Nhãn text mượt mà hơn
  const ratingLabels = {
    1: "Thất vọng",
    2: "Chưa tốt",
    3: "Bình thường",
    4: "Hài lòng",
    5: "Tuyệt vời",
  };

  // Thay đổi biểu cảm: Lịch sự, sang trọng và thân thiện hơn
  const faces = [
    { val: 1, emoji: "😞" }, // Buồn/Thất vọng
    { val: 2, emoji: "🙁" }, // Hơi không hài lòng
    { val: 3, emoji: "😐" }, // Bình thường
    { val: 4, emoji: "😊" }, // Vui vẻ/Hài lòng
    { val: 5, emoji: "🤩" }, // Tuyệt vời/Ấn tượng (Ngôi sao)
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Đánh giá trải nghiệm</h2>
        <p className={styles.subtitle}>
          Cảm nhận của bạn là thước đo chất lượng dịch vụ của chúng tôi
        </p>
      </div>

      {/* Khối Dark Mode làm nổi bật khu vực đánh giá */}
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
              <div className={styles.emojiWrapper}>
                <div className={styles.emoji}>{item.emoji}</div>
              </div>
              <span className={styles.label}>{ratingLabels[item.val]}</span>
            </div>
          ))}
        </div>

        <div className={styles.statusText}>
          {serviceRating ? (
            <div className={styles.selectedStatus}>
              Bạn cảm thấy: <span className={styles.highlightText}>{ratingLabels[serviceRating]}</span>
            </div>
          ) : (
            <div className={styles.hintText}>
              <span className={styles.pulse}>👉</span> Vui lòng chạm để chọn mức độ hài lòng
            </div>
          )}
        </div>
      </div>

      <div className={styles.btnGroup}>
        <button onClick={onBack} className={styles.backBtn}>
          Quay lại
        </button>
        <button 
          onClick={onNext} 
          className={`${styles.nextBtn} ${!serviceRating ? styles.disabled : ""}`}
          disabled={!serviceRating} 
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
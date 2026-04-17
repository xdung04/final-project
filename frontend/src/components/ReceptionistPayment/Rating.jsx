import React from "react";
import styles from "./Rating.module.scss";

export default function Rating({ data, setData, onNext, onBack }) {
  const { serviceRating } = data;

  const handleSelect = (value) => {
    setData({ ...data, serviceRating: value });
  };

  const faces = [
    { val: 1, emoji: "😡", label: "Rất tệ" },
    { val: 2, emoji: "😕", label: "Chưa tốt" },
    { val: 3, emoji: "😐", label: "Bình thường" },
    { val: 4, emoji: "😊", label: "Hài lòng" },
    { val: 5, emoji: "😍", label: "Tuyệt vời" },
  ];

  const selectedFace = faces.find((f) => f.val === serviceRating);

  return (
    <div className={styles.container}>
      {/* Decorative blobs */}
      <div className={styles.blobTop} />
      <div className={styles.blobBottom} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.ornament}>
          <span className={styles.ornLine} />
          <span className={styles.ornDiamond} />
          <span className={styles.ornLine} />
        </div>
        <p className={styles.eyebrow}>Đánh giá dịch vụ</p>
        <h2 className={styles.title}>Cảm nhận của bạn</h2>
        <p className={styles.subtitle}>
          Sự hài lòng của bạn là thước đo chất lượng của chúng tôi
        </p>
      </div>

      {/* Rating card */}
      <div className={styles.card}>
        <p className={styles.prompt}>Chạm vào biểu cảm phù hợp nhất</p>

        <div className={styles.faceRow}>
          {faces.map((item) => (
            <div
              key={item.val}
              className={`${styles.faceItem} ${
                serviceRating === item.val ? styles.active : ""
              }`}
              onClick={() => handleSelect(item.val)}
            >
              <span className={styles.emoji}>{item.emoji}</span>
              <span className={styles.faceLabel}>{item.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        <div className={styles.statusArea}>
          {serviceRating ? (
            <div className={styles.statusChosen}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>
                Đánh giá:{" "}
                <strong>{selectedFace?.label}</strong>{" "}
                {selectedFace?.emoji}
              </span>
            </div>
          ) : (
            <span className={styles.statusHint}>
              ✦ Vui lòng chọn mức độ hài lòng của bạn
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className={styles.btnGroup}>
        <button className={styles.backBtn} onClick={onBack}>
          ← Quay lại
        </button>
        <button
          className={styles.nextBtn}
          onClick={onNext}
          disabled={!serviceRating}
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
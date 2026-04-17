import React from "react";
import styles from "./Tips.module.scss";

export default function Tips({ data, setData, onNext, onBack }) {
  const { tip } = data;
  const amounts = [20000, 50000, 100000, 200000]; // Tăng mệnh giá cho khách cao cấp

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setData({ ...data, tip: Number(value) });
  };

  const formatVND = (num) =>
    num
      ? num.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
      : "";

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Cảm ơn bạn đã tin tưởng chúng tôi!</h2>
        <p className={styles.subtitle}>
          Hãy để lại một khoản tip nhỏ để tri ân thợ đã tạo kiểu tuyệt vời cho bạn.<br />
          <strong>100% tip sẽ được chuyển trực tiếp cho thợ.</strong>
        </p>
      </div>

      {/* Main Content */}
      <div className={styles.infoBox}>
        <div className={styles.tipGrid}>
          {amounts.map((amount) => (
            <button
              key={amount}
              className={`${styles.tipButton} ${
                tip === amount ? styles.activeTip : ""
              }`}
              onClick={() => setData({ ...data, tip: amount })}
            >
              {amount.toLocaleString()}đ
            </button>
          ))}
        </div>

        {/* Nhập tùy chọn */}
        <div className={styles.customTipBox}>
          <input
            type="text"
            placeholder="Nhập số tiền khác..."
            value={tip ? tip.toLocaleString("vi-VN") : ""}
            onChange={handleInputChange}
            className={styles.tipInput}
          />

          <div className={styles.messageWrapper}>
            {tip > 0 && (
              <p className={styles.tipMessage}>
                💎 Bạn đang tip <strong>{formatVND(tip)}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.btnGroup}>
        <button onClick={onBack} className={styles.backBtn}>
          ← Quay lại
        </button>
        <button onClick={onNext} className={styles.nextBtn}>
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
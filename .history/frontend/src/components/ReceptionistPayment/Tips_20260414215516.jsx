import React from "react";
import styles from "./Tips.module.scss";

export default function Tips({ data, setData, onNext, onBack }) {
  const { tip } = data;
  const amounts = [10000, 20000, 50000, 100000];

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
        <h2 className={styles.title}>Cảm ơn thợ đã tạo kiểu hoàn hảo cho bạn</h2>
        <p className={styles.subtitle}>
          Một khoản tip nhỏ sẽ là lời cảm ơn chân thành nhất.<br />
          Thợ sẽ nhận được 100% số tiền bạn tip.
        </p>
      </div>

      {/* Main Box */}
      <div className={styles.infoBox}>
        {/* Quick Tips */}
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

        {/* Custom Tip */}
        <div className={styles.customTipBox}>
          <input
            type="text"
            placeholder="Nhập số tiền tip khác..."
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
import React from "react";
import styles from "./Tips.module.scss";

export default function Tips({ data, setData, onNext, onBack }) {
  const { tip } = data;
  const amounts = [10000, 20000, 50000, 100000];

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // chỉ lấy số
    setData({ ...data, tip: Number(value) });
  };

  const formatVND = (num) =>
    num
      ? num.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
      : "";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Cảm ơn thợ cắt của bạn</h2>
        <p className={styles.subtitle}>
          Một khoản tip nhỏ sẽ giúp thợ có thêm động lực để phục vụ bạn tốt hơn
          <br />
          <span className={styles.optional}>(Bạn có thể bỏ qua nếu không muốn tip)</span>
        </p>
      </div>

      <div className={styles.infoBox}>
        <div className={styles.tipGrid}>
          {amounts.map((a) => (
            <button
              key={a}
              className={`${styles.tipButton} ${
                tip === a ? styles.activeTip : ""
              }`}
              onClick={() => setData({ ...data, tip: a })}
            >
              {a.toLocaleString()}đ
            </button>
          ))}
        </div>

        <div className={styles.customTipBox}>
          <input
            type="text"
            placeholder="Hoặc nhập số tiền khác..."
            value={tip ? tip.toLocaleString("vi-VN") : ""}
            onChange={handleInputChange}
            className={styles.tipInput}
          />
          <div className={styles.messageWrapper}>
            {tip > 0 && (
              <p className={styles.tipMessage}>
                Bạn đang tip: <strong>{formatVND(tip)}</strong> 💖
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.btnGroup}>
        <button onClick={onBack} className={styles.backBtn}>
          Quay lại
        </button>
        <button onClick={onNext} className={styles.nextBtn}>
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
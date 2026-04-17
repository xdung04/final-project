import React from "react";
import styles from "./Tips.module.scss";

export default function Tips({ data, setData, onNext, onBack }) {
  const { tip } = data;
  const amounts = [20000, 50000, 100000, 200000];

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
        <p className={styles.eyebrow}>Tri ân thợ cắt</p>
        <h2 className={styles.title}>Cảm ơn bạn!</h2>
        <p className={styles.subtitle}>
          100% tiền tip sẽ được chuyển trực tiếp cho thợ của bạn
        </p>
      </div>

      {/* Main Card */}
      <div className={styles.card}>
        <p className={styles.prompt}>Chọn mức tip hoặc nhập số khác</p>

        <div className={styles.tipGrid}>
          {amounts.map((amount) => (
            <div
              key={amount}
              className={`${styles.tipItem} ${
                tip === amount ? styles.active : ""
              }`}
              onClick={() => setData({ ...data, tip: amount })}
            >
              <span className={styles.tipValue}>
                {amount.toLocaleString("vi-VN")}
              </span>
              <span className={styles.tipCurrency}>VNĐ</span>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        <div className={styles.customTipBox}>
          <input
            type="text"
            placeholder="Nhập số tiền khác..."
            value={tip ? tip.toLocaleString("vi-VN") : ""}
            onChange={handleInputChange}
            className={styles.tipInput}
          />
        </div>

        <div className={styles.statusArea}>
          {tip > 0 ? (
            <div className={styles.statusChosen}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>
                Bạn đang tip: <strong>{formatVND(tip)}</strong> 💎
              </span>
            </div>
          ) : (
            <span className={styles.statusHint}>
              ✦ Bạn có thể bỏ qua bước này
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className={styles.btnGroup}>
        <button className={styles.backBtn} onClick={onBack}>
          ← Quay lại
        </button>
        <button className={styles.nextBtn} onClick={onNext}>
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
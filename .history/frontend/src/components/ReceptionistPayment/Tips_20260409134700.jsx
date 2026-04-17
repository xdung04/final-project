import React from "react";
import styles from "./PaymentModal.module.scss";

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
    <div className={styles.step1Container}>
      <h2 className={styles.title}>💰 Gửi chút cảm ơn cho thợ cắt của bạn</h2>

      <div className={styles.infoBox}>
        <p style={{ fontSize: "15px", color: "#ccc", marginBottom: "18px" }}>
          Một khoản tip nhỏ sẽ giúp thợ có thêm động lực để phục vụ bạn tốt hơn 💪
          <br />
          <span style={{ color: "#999", fontSize: "13px" }}>
            (Bạn có thể bỏ qua nếu không muốn tip)
          </span>
        </p>

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
            placeholder="Nhập số khác..."
            value={tip ? tip.toLocaleString("vi-VN") : ""}
            onChange={handleInputChange}
            className={styles.tipInput}
          />
          {tip > 0 && (
            <p style={{ color: "#d4a373", marginTop: "6px" }}>
              Bạn đang tip {formatVND(tip)} 💖
            </p>
          )}
        </div>
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

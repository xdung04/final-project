import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import styles from "./BarberCard.module.scss";

export default function BarberCard({ barber }) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();

  // Click card → mở trang thông tin thợ
  const handleOpenProfile = () => {
    navigate(`/barber/${barber.idBarber}`, { state: { barber } });
  };

  // Click nút Đặt lịch → không mở profile
  const handleBooking = (e) => {
    e.stopPropagation(); // ❗ Chặn sự kiện click lan lên card
    navigate("/booking", { state: { barber } });
  };

  return (
    <div
      className={styles.card}
      onClick={handleOpenProfile}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={styles.imageWrap}>
        <img src={barber.avatar} alt={barber.name} />
        <div className={styles.ratingBadge}>
          <Star size={12} fill="currentColor" />
          <span>{barber.rating}</span>
        </div>
      </div>

      <div className={styles.content}>
        <p className={styles.branch}>{barber.branch}</p>
        <h3 className={styles.name}>{barber.name}</h3>

        <button className={styles.bookBtn} onClick={handleBooking}>
          Đặt lịch ngay
        </button>

        {hover && (
          <div className={styles.hoverPanel}>
            <div className={styles.panelLeft}>
              <img src={barber.avatar} alt={barber.name} />
            </div>
            <div className={styles.panelRight}>
              <p>
                <strong>Thợ:</strong> {barber.name}
              </p>
              <p>
                <strong>Cơ sở:</strong> {barber.branch}
              </p>
              <p>
                <strong>Đánh giá:</strong>
                <Star size={12} fill="currentColor" className={styles.starIcon} />{" "}
                {barber.rating}
              </p>
              <p style={{ fontStyle: "italic", marginTop: "5px" }}>
                "
                {barber.description ||
                  "Chuyên gia tạo mẫu tóc với tư duy thẩm mỹ hiện đại và kỹ thuật tinh xảo tại Barber Lab."}
                "
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
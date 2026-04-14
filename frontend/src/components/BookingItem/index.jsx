import React from "react";
import styles from "./BookingItem.module.scss";
import { Calendar, Clock, MapPin, Scissors } from "lucide-react";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

export default function BookingItem({ booking }) {
  // Map trạng thái để hiển thị class CSS tương ứng
  const statusClass = booking.status?.toLowerCase() || "pending";

  return (
    <div className={styles.card}>
      {/* Badge trạng thái ở góc */}
      <div className={cx("status", statusClass)}>
        {booking.status === "COMPLETED" ? "Đã hoàn thành" : "Sắp tới"}
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.barberInfo}>
          <img 
            src={booking.barber.avatar} 
            alt={booking.barber.name} 
            className={styles.barberAvatar}
          />
          <div>
            <h3>{booking.barber.name}</h3>
            <p className={styles.branchName}>{booking.branch.name}</p>
          </div>
        </div>
      </div>

      {/* Details - Layout 2 cột giúp card gọn gàng hơn */}
      <div className={styles.details}>
        <p><Calendar size={16} /> {booking.date}</p>
        <p><Clock size={16} /> {booking.time}</p>
        <p><Scissors size={16} /> {booking.service}</p>
        <p><MapPin size={16} /> {booking.branch.address}</p>
      </div>
    </div>
  );
}
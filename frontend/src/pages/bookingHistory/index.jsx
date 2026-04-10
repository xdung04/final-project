import React, { useEffect, useState } from "react";
import styles from "./bookingHistory.module.scss";
import BookingItem from "~/components/BookingItem";
import { BookingHistoryAPI } from "~/apis/bookingHistoryAPI";

export default function BookingHistory() {
  const [completed, setCompleted] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedDates, setCollapsedDates] = useState({});
  const [filter, setFilter] = useState("all"); // all | upcoming | completed

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await BookingHistoryAPI.getBookingHistory();

        setCompleted(res.data.completed || []);
        setUpcoming(res.data.upcoming || []);
      } catch (error) {
        console.error("Lỗi lấy lịch sử booking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // 👉 chọn list theo filter
  const selectedBookings =
    filter === "completed"
      ? completed
      : filter === "upcoming"
      ? upcoming
      : [...completed, ...upcoming];

  // 👉 sort theo ngày mới nhất
  const sortedBookings = [...selectedBookings].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const toggleCollapse = (date) => {
    setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const groupByDate = (data) => {
    return data.reduce((acc, booking) => {
      const date = booking.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(booking);
      return acc;
    }, {});
  };

  const bookingsByDate = groupByDate(sortedBookings);

  return (
    <div
      className={styles.page}
      style={{
        backgroundImage: `url(/banner.png)`,
        backgroundAttachment: "fixed",
      }}
    >
      <div className={styles.overlay}></div>

      <div className={styles.list}>
        <h1 className={styles.title}>Lịch Hẹn Của Tôi</h1>

        {/* Bộ lọc */}
        <div className={styles.filterBar}>
          <button
            className={filter === "all" ? styles.active : ""}
            onClick={() => setFilter("all")}
          >
            Tất Cả
          </button>
          <button
            className={filter === "upcoming" ? styles.active : ""}
            onClick={() => setFilter("upcoming")}
          >
            Sắp Tới
          </button>
          <button
            className={filter === "completed" ? styles.active : ""}
            onClick={() => setFilter("completed")}
          >
            Đã Hoàn Thành
          </button>
        </div>

        {loading ? (
          <p className={styles.message}>Đang tải hành trình của bạn...</p>
        ) : Object.keys(bookingsByDate).length === 0 ? (
          <p className={styles.message}>Không có lịch hẹn nào trong mục này.</p>
        ) : (
          Object.entries(bookingsByDate).map(([date, dayBookings]) => {
            const isCollapsed = collapsedDates[date];
            return (
              <div key={date} className={styles.dayGroup}>
                <div
                  className={styles.dayTitle}
                  onClick={() => toggleCollapse(date)}
                >
                  <span>{date}</span>
                  <span style={{ fontSize: "12px" }}>
                    {isCollapsed ? "VIEW DETAILS ▼" : "COLLAPSE ▲"}
                  </span>
                </div>

                {!isCollapsed && (
                  <div className={styles.dayContent}>
                    {dayBookings.map((booking) => (
                      <BookingItem
                        key={booking.idBooking}
                        booking={booking}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
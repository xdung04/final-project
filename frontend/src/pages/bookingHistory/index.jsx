import React, { useEffect, useState } from "react";
import styles from "./bookingHistory.module.scss";
import BookingItem from "~/components/BookingItem";
import { BookingHistoryAPI } from "~/apis/bookingHistoryAPI";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState({});
  const [filter, setFilter] = useState("upcoming"); 
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  // 👉 Lần đầu tiên vào trang: Gọi mặc định tab "upcoming"
  useEffect(() => {
    fetchBookings("upcoming", 1, false);
  }, []);

  const fetchBookings = async (type, page, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await BookingHistoryAPI.getBookingHistory(type, page);
      console.log("Dữ liệu chuẩn nhận tại Component:", res);
      
      const newBookings = res?.data || []; 
      const pageInfo = res?.data?.pagination || { currentPage: 1, totalPages: 1 };

      if (isLoadMore) {
        setBookings((prev) => [...prev, ...newBookings]);
      } else {
        setBookings(newBookings); 
      }

      setPagination(pageInfo);
    } catch (error) {
      console.error("Lỗi lấy lịch sử booking:", error);
      if (!isLoadMore) setBookings([]); 
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 👉 Hàm xử lý khi khách click đổi Tab Bộ Lọc
  const handleFilterChange = (type) => {
    setFilter(type); // Cập nhật lại màu sắc nút active trên giao diện
    fetchBookings(type, 1, false); // Gọi thẳng API với giá trị type mới (không lo bất đồng bộ)
  };

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages && !loadingMore) {
      const nextPage = pagination.currentPage + 1;
      fetchBookings(filter, nextPage, true);
    }
  };

  const toggleCollapse = (date) => {
    setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const groupByDate = (data) => {
    if (!data || !Array.isArray(data)) return {};
    return data.reduce((acc, booking) => {
      const date = booking.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(booking);
      return acc;
    }, {});
  };

  const bookingsByDate = groupByDate(bookings);

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

        {/* Bộ lọc đã được cập nhật hàm handleFilterChange xử lý dứt điểm trễ State */}
        <div className={styles.filterBar}>
          <button
            className={filter === "upcoming" ? styles.active : ""}
            onClick={() => handleFilterChange("upcoming")}
          >
            Sắp Tới
          </button>
          <button
            className={filter === "completed" ? styles.active : ""}
            onClick={() => handleFilterChange("completed")}
          >
            Đã Hoàn Thành
          </button>
        </div>

        {loading ? (
          <p className={styles.message}>Đang tải hành trình của bạn...</p>
        ) : Object.keys(bookingsByDate).length === 0 ? (
          <p className={styles.message}>Không có lịch hẹn nào trong mục này.</p>
        ) : (
          <>
            {Object.entries(bookingsByDate).map(([date, dayBookings]) => {
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
            })}

            {pagination.currentPage < pagination.totalPages && (
              <div className={styles.loadMoreContainer}>
                <button 
                  className={styles.loadMoreBtn} 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Đang tải thêm..." : "Xem thêm lịch hẹn v"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
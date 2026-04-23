import React, { useEffect, useState, useCallback } from "react";
import styles from "./BookingList.module.scss";

export default function BookingList({ onSelect, date }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===========================
  // 🔄 FETCH BOOKING LIST
  // ===========================
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/details`);
      const data = await res.json();

      if (!data?.data) return;

      const list = data.data
        .filter((b) => b.bookingDate?.startsWith(date))
        .map((b) => {
          const serviceTotal =
            b.services?.reduce(
              (sum, s) => sum + (parseFloat(s.price) || 0) * (s.quantity || 1),
              0
            ) || 0;

          const tip = Number(b.tip) || 0;
          const discountPercent = Number(b.voucher?.discountPercent) || 0;
          const discountAmount = (serviceTotal * discountPercent) / 100;

          const subTotal = serviceTotal + tip;
          const finalTotal = subTotal - discountAmount;

          return {
            id: b.idBooking,
            time: b.bookingTime || "—",
            customer: b.customer?.name || "Khách lẻ",
            barber: b.barber?.name || "Chưa chỉ định",
            services: b.services?.map((s) => s.name) || [],
            branch: b.branch?.name || "",
            serviceTotal,
            tip,
            discountPercent,
            discountAmount,
            subTotal,
            finalTotal,
            isPaid: b.isPaid || false,
            status: b.status || "Pending",
            raw: b,
          };
        })
        .sort((a, b) => b.time.localeCompare(a.time));

      setBookings(list);
    } catch (err) {
      console.error("❌ Fetch booking error:", err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (onSelect) {
      onSelect((prev) => prev, fetchBookings);
    }
  }, [fetchBookings, onSelect]);

  // ===========================
  // ❌ HỦY BOOKING
  // ===========================
  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này không?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
        method: "PUT",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Hủy lịch thất bại!");
        return;
      }

      alert("Đã hủy lịch hẹn thành công!");
      fetchBookings();
    } catch (err) {
      console.error("❌ Cancel booking error:", err);
      alert("Có lỗi xảy ra khi hủy lịch!");
    }
  };

  // ===========================
  // ✅ CHECK-IN BOOKING
  // ===========================
  const handleCheckIn = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/checkin`, {
        method: "PUT",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Check-in thất bại!");
        return;
      }

      alert("Khách đã check-in!");
      fetchBookings();
    } catch (err) {
      console.error("❌ Check-in error:", err);
      alert("Có lỗi xảy ra khi check-in!");
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className={styles.list}>
      <h2>Lịch hẹn {date}</h2>

      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Giờ</th>
              <th>Khách hàng</th>
              <th>Thợ cắt</th>
              <th>Dịch vụ</th>
              <th>Chi nhánh</th>
              <th>Chi tiết thanh toán</th>
              <th>Tiến trình</th>
              <th>Thanh toán</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  Không có lịch hẹn nào trong ngày này
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const { id, services } = booking;

                const displayedServices =
                  services.length > 2
                    ? `${services.slice(0, 2).join(", ")} (+${services.length - 2})`
                    : services.join(", ");

                return (
                  <tr key={id}>
                    <td>{booking.time}</td>
                    <td>{booking.customer}</td>
                    <td>{booking.barber}</td>
                    <td title={services.join(", ")}>{displayedServices || "—"}</td>
                    <td>{booking.branch}</td>

                    <td>
                      <div>
                        <div>
                          <strong>Tạm tính:</strong> {booking.subTotal.toLocaleString("vi-VN")}đ
                        </div>

                        {booking.discountPercent > 0 && (
                          <div style={{ color: "#e67e22" }}>
                            Giảm {booking.discountPercent}% (-{booking.discountAmount.toLocaleString("vi-VN")}đ)
                          </div>
                        )}

                        <div>
                          <strong>Tip:</strong> {booking.tip.toLocaleString("vi-VN")}đ
                        </div>

                        <div style={{ color: "#0a7f25", fontWeight: 600 }}>
                          Tổng cộng: {booking.finalTotal.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                    </td>

                    <td
                      className={
                        booking.status === "Completed"
                          ? styles.completed
                          : booking.status === "Cancelled"
                          ? styles.cancelled
                          : booking.status === "InProgress"
                          ? styles.inprogress
                          : styles.pending
                      }
                    >
                      {booking.status === "Completed"
                        ? "Đã cắt xong"
                        : booking.status === "Cancelled"
                        ? "Đã hủy"
                        : booking.status === "InProgress"
                        ? "Đang thực hiện"
                        : "Đang chờ"}
                    </td>

                    <td className={booking.isPaid ? styles.paid : styles.unpaid}>
                      {booking.status === "Completed"
                        ? booking.isPaid
                          ? "Đã thanh toán"
                          : "Chưa thanh toán"
                        : "—"}
                    </td>

                    <td style={{ display: "flex", gap: "6px" }}>
                      {/* Thanh toán chỉ hiển thị khi Completed */}
                      {booking.status === "Completed" && !booking.isPaid && (
                        <button onClick={() => onSelect(booking.raw, fetchBookings)}>
                          Thanh toán
                        </button>
                      )}

                      {/* Check-in */}
                      {booking.status === "Pending" && (
                        <button className={styles.checkinBtn} onClick={() => handleCheckIn(id)}>
                          Check-in
                        </button>
                      )}

                      {/* Hủy lịch (Chỉ Pending) */}
                      {booking.status === "Pending" && (
                        <button className={styles.cancelBtn} onClick={() => handleCancel(id)}>
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

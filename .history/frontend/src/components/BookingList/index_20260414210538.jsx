import React, { useEffect, useState, useCallback } from "react";
import { Clock, User, Scissors, MapPin, ReceiptText, Activity, Wallet, MoreHorizontal } from "lucide-react";
import styles from "./BookingList.module.scss";

export default function BookingList({ onSelect, date }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===========================
  // 🔄 FETCH BOOKING LIST (Giữ nguyên logic của ông)
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
  // ❌ HỦY BOOKING (Giữ nguyên)
  // ===========================
  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này không?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Hủy lịch thất bại!");
      alert("Đã hủy lịch hẹn thành công!");
      fetchBookings();
    } catch (err) {
      alert("Có lỗi xảy ra khi hủy lịch!");
    }
  };

  // ===========================
  // ✅ CHECK-IN BOOKING (Giữ nguyên)
  // ===========================
  const handleCheckIn = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/checkin`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Check-in thất bại!");
      alert("Khách đã check-in!");
      fetchBookings();
    } catch (err) {
      alert("Có lỗi xảy ra khi check-in!");
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải dữ liệu lịch hẹn...</div>;

  return (
    <div className={styles.listWrapper}>
      <h2 className={styles.title}>Danh Sách Lịch Hẹn</h2>

      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th><div className={styles.thContent}><Clock size={16}/> Giờ</div></th>
              <th><div className={styles.thContent}><User size={16}/> Khách hàng</div></th>
              <th><div className={styles.thContent}><Scissors size={16}/> Thợ cắt</div></th>
              <th><div className={styles.thContent}><MoreHorizontal size={16}/> Dịch vụ</div></th>
              <th><div className={styles.thContent}><ReceiptText size={16}/> Chi tiết Bill</div></th>
              <th><div className={styles.thContent}><Activity size={16}/> Trạng thái</div></th>
              <th><div className={styles.thContent}><Wallet size={16}/> Thanh toán</div></th>
              <th className={styles.alignRight}>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.emptyState}>
                  Không có lịch hẹn nào trong ngày này.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const { id, services } = booking;
                const displayedServices = services.length > 2
                    ? `${services.slice(0, 2).join(", ")} (+${services.length - 2})`
                    : services.join(", ");

                return (
                  <tr key={id}>
                    <td className={styles.timeCell}>{booking.time}</td>
                    <td className={styles.boldCell}>{booking.customer}</td>
                    <td>{booking.barber}</td>
                    <td title={services.join(", ")} className={styles.truncateCell}>
                      {displayedServices || "—"}
                    </td>

                    <td>
                      <div className={styles.billDetails}>
                        <div className={styles.billRow}>
                          <span>Tạm tính:</span> 
                          <span>{booking.subTotal.toLocaleString("vi-VN")}đ</span>
                        </div>
                        {booking.discountPercent > 0 && (
                          <div className={`${styles.billRow} ${styles.discount}`}>
                            <span>Giảm {booking.discountPercent}%:</span> 
                            <span>-{booking.discountAmount.toLocaleString("vi-VN")}đ</span>
                          </div>
                        )}
                        <div className={styles.billRow}>
                          <span>Tip:</span> 
                          <span>{booking.tip.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className={`${styles.billRow} ${styles.total}`}>
                          <span>Tổng:</span> 
                          <span>{booking.finalTotal.toLocaleString("vi-VN")}đ</span>
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái tiến trình */}
                    <td>
                      <span className={`${styles.badge} ${styles[`status_${booking.status}`]}`}>
                        {booking.status === "Completed" ? "Đã cắt xong"
                          : booking.status === "Cancelled" ? "Đã hủy"
                          : booking.status === "InProgress" ? "Đang thực hiện"
                          : "Đang chờ"}
                      </span>
                    </td>

                    {/* Trạng thái thanh toán */}
                    <td>
                      {booking.status === "Completed" ? (
                         <span className={`${styles.badge} ${booking.isPaid ? styles.paid : styles.unpaid}`}>
                           {booking.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                         </span>
                      ) : (
                        <span className={styles.textMuted}>—</span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className={styles.actionCell}>
                      <div className={styles.actionButtons}>
                        {booking.status === "Completed" && !booking.isPaid && (
                          <button className={styles.btnCheckout} onClick={() => onSelect(booking.raw, fetchBookings)}>
                            Thanh toán
                          </button>
                        )}
                        {booking.status === "Pending" && (
                          <>
                            <button className={styles.btnCheckin} onClick={() => handleCheckIn(id)}>
                              Check-in
                            </button>
                            <button className={styles.btnCancel} onClick={() => handleCancel(id)}>
                              Hủy
                            </button>
                          </>
                        )}
                      </div>
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
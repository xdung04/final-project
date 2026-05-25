import React, { useEffect, useState, useCallback } from "react";
import {
  Clock,
  User,
  Scissors,
  ReceiptText,
  Activity,
  Wallet,
  MoreHorizontal,
} from "lucide-react";
import styles from "./BookingList.module.scss";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Lấy idBranch của receptionist từ token
async function fetchMyBranch(token) {
  const res = await fetch(`${API_BASE_URL}/receptionist/my-branch`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không lấy được thông tin chi nhánh");
  return res.json();
}

// Lấy bookings theo idBranch và ngày
async function fetchBookingsByBranch(idBranch, date, token) {
  const res = await fetch(
    `${API_BASE_URL}/bookings/branch/${idBranch}?date=${date}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Không lấy được danh sách lịch hẹn");
  const json = await res.json();
  return json.data || [];
}

export default function BookingList({ onSelect, date }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);

  const token = localStorage.getItem("accessToken");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Bước 1: lấy branch của receptionist
      const branch = await fetchMyBranch(token);
      setBranchInfo(branch);

      // Bước 2: lấy bookings theo branch + ngày
      const raw = await fetchBookingsByBranch(branch.idBranch, date, token);

      // Bước 3: map dữ liệu
      const list = raw.map((b) => ({
        id: b.idBooking,
        time: b.bookingTime || "—",
        customer: b.customer?.name || "Khách lẻ",
        barber: b.barber?.name || "Chưa chỉ định",
        services: b.services?.map((s) => s.name) || [],
        serviceTotal: parseFloat(b.serviceTotal || 0),
        tip: parseFloat(b.tip || 0),
        discountAmount: parseFloat(b.discountAmount || 0),
        discountPercent: parseFloat(b.discountPercent || 0),
        discountFixed: parseFloat(b.discountFixed || 0),
        voucherType: b.voucher?.type || null, // ← sửa ở đây
        total: parseFloat(b.total || 0),
        isPaid: b.isPaid || false,
        status: b.status || "Pending",
        raw: b,
      }));

      setBookings(list);
    } catch (err) {
      console.error("❌ Lỗi fetch booking:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date, token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Expose hàm reload ra ngoài
  useEffect(() => {
    if (onSelect) {
      onSelect((prev) => prev, fetchBookings);
    }
  }, [fetchBookings, onSelect]);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này không?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Hủy lịch thất bại!");
      alert("Đã hủy lịch hẹn thành công!");
      fetchBookings();
    } catch (err) {
      alert("Có lỗi xảy ra khi hủy lịch!");
    }
  };

  const handleCheckIn = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/checkin`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Check-in thất bại!");
      alert("Khách đã check-in!");
      fetchBookings();
    } catch (err) {
      alert("Có lỗi xảy ra khi check-in!");
    }
  };

  if (loading)
    return <div className={styles.loading}>Đang tải dữ liệu lịch hẹn...</div>;
  if (error)
    return (
      <div className={styles.loading} style={{ color: "red" }}>
        Lỗi: {error}
      </div>
    );

  return (
    <div className={styles.listWrapper}>
      <h2 className={styles.title}>
        Danh Sách Lịch Hẹn
        {branchInfo && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              marginLeft: 12,
              color: "#888",
            }}
          >
            — {branchInfo.branchName}
          </span>
        )}
      </h2>

      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>
                <div className={styles.thContent}>
                  <Clock size={16} /> Giờ
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <User size={16} /> Khách hàng
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <Scissors size={16} /> Thợ cắt
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <MoreHorizontal size={16} /> Dịch vụ
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <ReceiptText size={16} /> Chi tiết Bill
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <Activity size={16} /> Trạng thái
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <Wallet size={16} /> Thanh toán
                </div>
              </th>
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
                const displayedServices =
                  booking.services.length > 2
                    ? `${booking.services.slice(0, 2).join(", ")} (+${booking.services.length - 2})`
                    : booking.services.join(", ");

                return (
                  <tr key={booking.id}>
                    <td className={styles.timeCell}>{booking.time}</td>
                    <td className={styles.boldCell}>{booking.customer}</td>
                    <td>{booking.barber}</td>
                    <td
                      title={booking.services.join(", ")}
                      className={styles.truncateCell}
                    >
                      {displayedServices || "—"}
                    </td>

                    <td>
                      <div className={styles.billDetails}>
                        <div className={styles.billRow}>
                          <span>Tạm tính:</span>
                          <span>
                            {booking.serviceTotal.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                        {booking.discountAmount > 0 && (
                          <div
                            className={`${styles.billRow} ${styles.discount}`}
                          >
                            {booking.voucherType === "POINTS_EXCHANGE" ? (
                              <span>Giảm tiền:</span>
                            ) : booking.discountPercent > 0 ? (
                              <span>Giảm {booking.discountPercent}%:</span>
                            ) : (
                              <span>Giảm:</span>
                            )}
                            <span>
                              -{booking.discountAmount.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        )}
                        <div className={styles.billRow}>
                          <span>Tip:</span>
                          <span>{booking.tip.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className={`${styles.billRow} ${styles.total}`}>
                          <span>Tổng:</span>
                          <span>{booking.total.toLocaleString("vi-VN")}đ</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`${styles.badge} ${styles[`status_${booking.status}`]}`}
                      >
                        {booking.status === "Completed"
                          ? "Đã cắt xong"
                          : booking.status === "Cancelled"
                            ? "Đã hủy"
                            : booking.status === "InProgress"
                              ? "Đang thực hiện"
                              : "Đang chờ"}
                      </span>
                    </td>

                    <td>
                      {booking.status === "Completed" ? (
                        <span
                          className={`${styles.badge} ${booking.isPaid ? styles.paid : styles.unpaid}`}
                        >
                          {booking.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                        </span>
                      ) : (
                        <span className={styles.textMuted}>—</span>
                      )}
                    </td>

                    <td className={styles.actionCell}>
                      <div className={styles.actionButtons}>
                        {booking.status === "Completed" && !booking.isPaid && (
                          <button
                            className={styles.btnCheckout}
                            onClick={() => onSelect(booking.raw, fetchBookings)}
                          >
                            Thanh toán
                          </button>
                        )}
                        {booking.status === "Pending" && (
                          <>
                            <button
                              className={styles.btnCheckin}
                              onClick={() => handleCheckIn(booking.id)}
                            >
                              Check-in
                            </button>
                            <button
                              className={styles.btnCancel}
                              onClick={() => handleCancel(booking.id)}
                            >
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

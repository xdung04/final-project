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
import {
  fetchMyBranch,
  fetchBookingsByBranch,
  checkInBooking,
  cancelBooking,
} from "~/services/bookingService"; 
import { useToast } from "~/context/ToastContext"; // ← thêm// Đổi lại đường dẫn thư mục service của m nếu cần nhé

export default function BookingList({ onSelect, date }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);
  const { showToast } = useToast();

  // Hàm reload danh sách
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Bước 1: lấy branch của receptionist qua Service
      const branch = await fetchMyBranch();
      setBranchInfo(branch);

      // Bước 2: lấy bookings theo branch + ngày qua Service
      const resData = await fetchBookingsByBranch(branch.idBranch, date);
      const raw = resData.data || [];

      // Bước 3: map dữ liệu (Giữ nguyên 100% logic hiển thị của m)
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
        voucherType: b.voucher?.type || null, 
        total: parseFloat(b.total || 0),
        isPaid: b.isPaid || false,
        status: b.status || "Pending",
        raw: b,
      }));

      setBookings(list);
    } catch (err) {
      console.error("❌ Lỗi fetch booking:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [date]); // Sạch sẽ tuyệt đối, không dính dependency 'token' làm lặp loop

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Expose hàm reload ra ngoài Component cha
  useEffect(() => {
    if (onSelect) {
      onSelect((prev) => prev, fetchBookings);
    }
  }, [fetchBookings, onSelect]);

const handleCancel = async (id) => {
  if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này không?")) return;
  try {
    const data = await cancelBooking(id);
    if (data && data.success === false) {
      showToast({ text: data.message || "Hủy lịch thất bại!", type: "error" }); // ← đổi
      return;
    }
    showToast({ text: data.message || "Đã hủy lịch hẹn thành công!", type: "success" }); // ← đổi
    fetchBookings();
  } catch (err) {
    showToast({ text: err.response?.data?.message || "Có lỗi xảy ra khi hủy lịch!", type: "error" }); // ← đổi
  }
};

const handleCheckIn = async (id) => {
  try {
    const data = await checkInBooking(id);
    if (data && data.success === false) {
      showToast({ text: data.message || "Check-in thất bại!", type: "error" }); // ← đổi
      return;
    }
    showToast({ text: data.message || "Khách đã check-in!", type: "success" }); // ← đổi
    fetchBookings();
  } catch (err) {
    showToast({ text: err.response?.data?.message || "Có lỗi xảy ra khi check-in!", type: "error" }); // ← đổi
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
          <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 12, color: "#888" }}>
            — {branchInfo.branchName}
          </span>
        )}
      </h2>

      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th><div className={styles.thContent}><Clock size={16} /> Giờ</div></th>
              <th><div className={styles.thContent}><User size={16} /> Khách hàng</div></th>
              <th><div className={styles.thContent}><Scissors size={16} /> Thợ cắt</div></th>
              <th><div className={styles.thContent}><MoreHorizontal size={16} /> Dịch vụ</div></th>
              <th><div className={styles.thContent}><ReceiptText size={16} /> Chi tiết Bill</div></th>
              <th><div className={styles.thContent}><Activity size={16} /> Trạng thái</div></th>
              <th><div className={styles.thContent}><Wallet size={16} /> Thanh toán</div></th>
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
                    <td title={booking.services.join(", ")} className={styles.truncateCell}>
                      {displayedServices || "—"}
                    </td>

                    <td>
                      <div className={styles.billDetails}>
                        <div className={styles.billRow}>
                          <span>Tạm tính:</span>
                          <span>{booking.serviceTotal.toLocaleString("vi-VN")}đ</span>
                        </div>
                        {booking.discountAmount > 0 && (
                          <div className={`${styles.billRow} ${styles.discount}`}>
                            {booking.voucherType === "POINTS_EXCHANGE" ? (
                              <span>Giảm tiền:</span>
                            ) : booking.discountPercent > 0 ? (
                              <span>Giảm {booking.discountPercent}%:</span>
                            ) : (
                              <span>Giảm:</span>
                            )}
                            <span>-{booking.discountAmount.toLocaleString("vi-VN")}đ</span>
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
                      <span className={`${styles.badge} ${styles[`status_${booking.status}`]}`}>
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
                        <span className={`${styles.badge} ${booking.isPaid ? styles.paid : styles.unpaid}`}>
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
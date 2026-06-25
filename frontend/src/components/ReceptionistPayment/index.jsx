// File: src/components/ReceptionistPayment/index.jsx
import React, { useState, useEffect } from "react";
import styles from "./PaymentModal.module.scss";
import monitorStyles from "./MonitoringView.module.scss";
import Step1_BookingInfo from "./BookingInfo";
import socket from "../../utils/socket";
import { PaymentAPI } from "~/apis/paymentAPI";

// --- COMPONENT PHỤ: MONITOR VIEW ---
const MonitoringView = ({ guestProgress, onCancel, onCashPayment }) => {
  const totalPayment = (guestProgress.total || 0) + (guestProgress.tip || 0);

  const getStatusInfo = (progress) => {
    if (progress.isPaid) {
      return {
        text: "✅ KHÁCH ĐÃ THANH TOÁN THÀNH CÔNG!",
        className: monitorStyles.statusSuccess,
        isDone: true,
      };
    }

    const steps = {
      2: { text: "Khách đang đánh giá dịch vụ...", className: "" },
      3: { text: "Khách đang chọn tiền Tip...", className: "" },
      4: { text: "Khách đang kiểm tra hóa đơn...", className: "" },
      5: {
        text: "Khách đang thực hiện chuyển khoản...",
        className: monitorStyles.statusWarning,
      },
      6: {
        text: "Khách yêu cầu thanh toán TIỀN MẶT",
        className: monitorStyles.statusAlert,
      },
    };

    return (
      steps[progress.step] || {
        text: "Đang chờ khách thao tác...",
        className: "",
      }
    );
  };

  const status = getStatusInfo(guestProgress);

  return (
    <div className={monitorStyles.monitoringContent}>
      <div className={`${monitorStyles.statusBadge} ${status.className}`}>
        {!guestProgress.isPaid && (
          <div className={monitorStyles.pulseDot}></div>
        )}
        <span>{status.text}</span>
      </div>

      <div className={monitorStyles.liveStats}>
        <div className={monitorStyles.statItem}>
          <label>Đánh giá</label>
          <span className={monitorStyles.stars}>
            {guestProgress.rating > 0
              ? "⭐".repeat(guestProgress.rating)
              : "Chưa có"}
          </span>
        </div>
        <div className={monitorStyles.statItem}>
          <label>Tiền Tip</label>
          <span className={monitorStyles.value}>
            {guestProgress.tip > 0
              ? `${guestProgress.tip.toLocaleString("vi-VN")}đ`
              : "0đ"}
          </span>
        </div>

        <div
          className={monitorStyles.statItem}
          style={{ gridColumn: "1 / -1" }}
        >
          <label>
            {guestProgress.isPaid ? "Tiền đã nhận" : "Tổng tiền hóa đơn"}
          </label>
          <span
            className={monitorStyles.value}
            style={{
              color: guestProgress.isPaid ? "#22c55e" : "#d4af77",
              fontSize: "1.6rem",
            }}
          >
            {totalPayment > 0
              ? `${totalPayment.toLocaleString("vi-VN")}đ`
              : "—"}
          </span>
        </div>
      </div>

      <div className={monitorStyles.actionGroup}>
        {guestProgress.isPaid ? (
          <button
            onClick={onCashPayment}
            className={monitorStyles.btnSuccess}
            style={{ width: "100%" }}
          >
            Hoàn tất & Lưu hóa đơn
          </button>
        ) : (
          <>
            <button onClick={onCancel} className={monitorStyles.btnCancel}>
              ✕ Hủy & Rút bill
            </button>
            <button
              onClick={onCashPayment}
              className={monitorStyles.btnCash}
              disabled={guestProgress.step !== 6}
            >
              Xác nhận thu tiền mặt
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---
export default function ReceptionistPayment({
  booking,
  idBranch,
  onClose,
  onPushSuccess,
}) {
  const [formData, setFormData] = useState(null);
  const [mode, setMode] = useState("EDIT");
  const [cashPayload, setCashPayload] = useState(null);
  const [guestProgress, setGuestProgress] = useState({
    step: 1,
    rating: 0,
    tip: 0,
    total: 0,
    isPaid: false,
  });

  // ✅ FIX 1: Join room ngay khi mở modal + rejoin khi socket reconnect
  useEffect(() => {
    if (!idBranch) return;

    const joinRoom = () => {
      socket.emit("receptionist_join_checkout", {
        idBranch,
        receptionistId: "receptionist",
      });
      console.log(`👤 Lễ tân joined checkout room: checkout_branch_${idBranch}`);
    };

    // Join ngay lập tức
    joinRoom();

    // Tự động rejoin nếu socket bị ngắt rồi kết nối lại
    socket.on("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [idBranch]);

  // ✅ FIX 2: Lắng nghe socket event riêng, không phụ thuộc vào booking thay đổi
  useEffect(() => {
    const handleProgress = (data) => {
      console.log("📱 Nhận tiến độ từ iPad:", data);
      setGuestProgress((prev) => ({ ...prev, ...data }));
    };

    const handleCashPayment = (data) => {
      console.log("💵 Nhận yêu cầu thanh toán tiền mặt:", data);
      setCashPayload(data);
      setGuestProgress((prev) => ({ ...prev, ...data, step: 6 }));
    };

    socket.on("receive_customer_progress", handleProgress);
    socket.on("customer_choose_cash_payment", handleCashPayment);

    return () => {
      socket.off("receive_customer_progress", handleProgress);
      socket.off("customer_choose_cash_payment", handleCashPayment);
    };
  }, []); // Chỉ chạy 1 lần khi mount

  // Setup formData khi booking thay đổi
  useEffect(() => {
    if (!booking) return;

    setGuestProgress({ step: 1, rating: 0, tip: 0, total: 0, isPaid: false });

    const initialData = {
      booking: {
        idBooking: booking.idBooking,
        customer: booking.customer?.name || "Khách lẻ",
        barber: booking.barber?.name || "Chưa chỉ định",
        time: booking.bookingTime || "Không rõ",
        branch: booking.branch?.name || "",
        branchId: booking.branch?.id || null,
      },
      services:
        booking.services?.map((s) => ({
          id: s.id,
          name: s.name,
          price: parseFloat(s.price) || 0,
          selected: true,
        })) || [],
      voucher: booking.voucher || null,
      serviceRating: 0,
      tip: parseFloat(booking.tip || 0),
      note: booking.description || "",
    };

    setFormData(initialData);
  }, [booking]);

  const handlePushToKiosk = (finalData) => {
    if (!idBranch) {
      console.error("❌ Missing idBranch - cannot push to kiosk");
      alert("Lỗi: Không tìm thấy thông tin chi nhánh");
      return;
    }

    console.log(`📤 Push bill tới iPad chi nhánh ${idBranch}`);
    socket.emit("admin_push_checkout", {
      idBranch,
      bookingId: finalData.booking.idBooking,
      formData: finalData,
      timestamp: new Date().toISOString(),
    });
    setMode("MONITOR");
  };

  const handleCancelMonitoring = () => {
    if (!idBranch) {
      console.error("❌ Missing idBranch - cannot cancel checkout");
      alert("Lỗi: Không tìm thấy thông tin chi nhánh");
      return;
    }

    console.log(`❌ Hủy bill của chi nhánh ${idBranch}`);
    socket.emit("admin_cancel_checkout", {
      idBranch,
      bookingId: formData.booking.idBooking,
      timestamp: new Date().toISOString(),
    });
    setMode("EDIT");
  };

  const handleFinalize = async () => {
    if (guestProgress.isPaid) {
      if (onPushSuccess) onPushSuccess();
      onClose();
      return;
    }

    if (guestProgress.step === 6 && cashPayload) {
      try {
        await PaymentAPI.create(formData.booking.idBooking, {
          ...cashPayload,
          idBranch,
        });

        console.log("✅ Thanh toán CASH thành công");
        if (onPushSuccess) onPushSuccess();
        onClose();
      } catch (error) {
        console.error("❌ Lỗi thanh toán CASH:", error);
        alert("Xác nhận thất bại, vui lòng thử lại");
      }
    } else {
      if (onPushSuccess) onPushSuccess();
      onClose();
    }
  };

  if (!formData) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {mode === "EDIT" && (
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        )}

        {mode === "EDIT" ? (
          <Step1_BookingInfo
            data={formData}
            setData={setFormData}
            onNext={handlePushToKiosk}
          />
        ) : (
          <MonitoringView
            guestProgress={guestProgress}
            onCancel={handleCancelMonitoring}
            onCashPayment={handleFinalize}
          />
        )}
      </div>
    </div>
  );
}
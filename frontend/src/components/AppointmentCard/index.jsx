import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./AppointmentCard.module.scss";
import CompleteAppointmentDialog from "~/components/CompleteAppointmentDialog";
import { Phone, Users, Scissors, VolumeX } from "lucide-react";

const cx = classNames.bind(styles);

// Ánh xạ status thật từ API (Pending/InProgress/Completed/Cancelled)
// sang key dùng cho class CSS + tính thống kê ở trang LichHen.
export function getApptStatusKey(status) {
  switch (status) {
    case "Pending":
      return "pending";
    case "InProgress":
      return "inprogress";
    case "Completed":
      return "completed";
    case "Cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function AppointmentCard({ appt, view }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Dịch vụ
  const serviceNames =
    appt.BookingDetails?.map((d) => d.service?.name).join(", ") || "—";

  // Khách
  const customerName = appt.Customer?.user.fullName || "Khách vãng lai";
  const customerPhone = appt.Customer?.user.phoneNumber || "Không có số";
  const isWalkIn = customerPhone === "Không có số";

  // Trạng thái logic
  const status = appt.status; // Pending, InProgress, Completed, Cancelled
  let statusText = "";
  let statusType = "";
  let canComplete = false;

  switch (status) {
    case "Pending":
      statusText = "Đang chờ";
      statusType = "pending";
      canComplete = false;
      break;
    case "InProgress":
      statusText = "Đang thực hiện";
      statusType = "inprogress";
      canComplete = true;
      break;
    case "Completed":
      statusText = "Đã hoàn thành";
      statusType = "completed";
      canComplete = false;
      break;
    case "Cancelled":
      statusText = "Đã hủy";
      statusType = "cancelled";
      canComplete = false;
      break;
    default:
      statusText = status;
      statusType = "";
      canComplete = false;
  }

  // Ghi chú (kiểu tóc / yêu cầu im lặng) — parse an toàn
  let desc = {};
  if (appt.description) {
    try {
      desc = JSON.parse(appt.description);
    } catch {
      desc = {};
    }
  }

  return (
    <div className={cx("card", { weekCard: view === "week" }, statusType)}>
      {/* chấm trạng thái trên trục thời gian (chỉ ở chế độ ngày) */}
      {view === "day" && <span className={cx("railDot", statusType)} />}

      {/* Thời gian */}
      <div className={cx("timeBox")}>
        <div className={cx("time")}>{appt.bookingTime}</div>
        {view === "day" && (
          <div className={cx("duration")}>
            {appt.BookingDetails?.[0]?.service?.duration || "?"} phút
          </div>
        )}
      </div>

      {/* Thông tin */}
      <div className={cx("info")}>
        {view === "day" ? (
          <>
            <div className={cx("nameRow")}>
              <span className={cx("avatar")}>{getInitials(customerName)}</span>
              <h3 className={cx("name")}>{customerName}</h3>
            </div>

            {!isWalkIn ? (
              <p className={cx("phone")}>
                <Phone size={12} strokeWidth={2} />
                {customerPhone}
              </p>
            ) : (
              <p className={cx("phone", "walkIn")}>(Khách vãng lai)</p>
            )}

            <div className={cx("tags")}>
              <span className={cx("service")}>
                <Scissors size={11} strokeWidth={2} />
                {serviceNames}
              </span>
              <span className={cx("guest")}>
                <Users size={11} strokeWidth={2} />
                {appt.guestCount} khách
              </span>
            </div>

            {(desc.hairstyle || desc.silentMode) && (
              <div className={cx("notes")}>
                {desc.hairstyle && (
                  <p className={cx("note")}>
                    <strong>Kiểu tóc:</strong> {desc.hairstyle}
                  </p>
                )}
                {desc.silentMode && (
                  <p className={cx("note", "silentNote")}>
                    <VolumeX size={11} strokeWidth={2} />
                    Khách yêu cầu giữ im lặng
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className={cx("service", "weekService")}>{serviceNames}</p>
        )}
      </div>

      {/* Hành động / trạng thái */}
      <div className={cx("actions")}>
        {canComplete ? (
          <button
            type="button"
            className={cx("completeBtn")}
            onClick={() => setDialogOpen(true)}
          >
            Hoàn tất
          </button>
        ) : (
          <span className={cx("statusLabel", statusType)}>
            <span className={cx("dot", statusType)} />
            {statusText}
          </span>
        )}
      </div>

      {/* Dialog hoàn tất - rendered via Portal */}
      <CompleteAppointmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        appointment={{
          idBooking: appt.idBooking,
          idBarber: appt.idBarber,
          idCustomer: appt.idCustomer,
          customerName,
          services: serviceNames,
        }}
      />
    </div>
  );
}

export default AppointmentCard;
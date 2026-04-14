import React, { useState } from "react";
import styles from "./AppointmentCard.module.scss";
import CompleteAppointmentDialog from "~/components/CompleteAppointmentDialog";

function AppointmentCard({ appt, view }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Dịch vụ
  const serviceNames =
    appt.BookingDetails?.map((d) => d.service?.name).join(", ") || "—";

  // Khách
  const customerName = appt.Customer?.user.fullName || "Khách vãng lai";
  const customerPhone = appt.Customer?.user.phoneNumber || "Không có số";

  // Trạng thái logic
  const status = appt.status; // Pending, InProgress, Completed, Cancelled
  let statusText = "";
  let canComplete = false;

  switch (status) {
    case "Pending":
      statusText = "Đang chờ (chưa check-in)";
      canComplete = false;
      break;
    case "InProgress":
      statusText = "Đang thực hiện";
      canComplete = true; // khách đã check-in, thợ được bấm hoàn tất
      break;
    case "Completed":
      statusText = "Đã hoàn thành";
      canComplete = false;
      break;
    case "Cancelled":
      statusText = "Đã hủy";
      canComplete = false;
      break;
    default:
      statusText = status;
      canComplete = false;
  }

  return (
    <div
      className={`${styles.card} ${view === "week" ? styles.weekCard : ""}`}
    >
      {/* Thời gian */}
      <div className={styles.timeBox}>
        <div className={styles.time}>{appt.bookingTime}</div>
        {view === "day" && (
          <div className={styles.duration}>
            {appt.BookingDetails?.[0]?.service?.duration || "?"} phút
          </div>
        )}
      </div>

      {/* Thông tin */}
      <div className={styles.info}>
        {view === "day" ? (
          <>
            <h3 className={styles.name}>{customerName}</h3>
            <p className={styles.phone}>
              {customerPhone === "Không có số"
                ? "(Khách vãng lai)"
                : customerPhone}
            </p>
            <p className={styles.service}>
              <strong>Dịch vụ:</strong> {serviceNames}
            </p>
            <p className={styles.guest}>
              <strong>Số khách:</strong> {appt.guestCount}
            </p>
            {appt.description && (
              <p className={styles.note}>
                <strong>Ghi chú:</strong> {appt.description}
              </p>
            )}
          </>
        ) : (
          <p className={styles.service}>{serviceNames}</p>
        )}
      </div>

      {/* Hành động / trạng thái */}
      <div className={styles.actions}>
        {canComplete ? (
          <button
            className={styles.completeBtn}
            onClick={() => setDialogOpen(true)}
          >
            Hoàn tất
          </button>
        ) : (
          <span
            className={`${styles.statusLabel} ${
              status === "Cancelled"
                ? styles.cancelled
                : status === "Completed"
                ? styles.completed
                : status === "InProgress"
                ? styles.inprogress
                : ""
            }`}
          >
            {statusText}
          </span>
        )}
      </div>

      {/* Dialog hoàn tất */}
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

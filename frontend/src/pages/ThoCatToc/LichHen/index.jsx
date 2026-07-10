import React, { useState, useEffect } from "react";
import styles from "./LichHen.module.scss";
import AppointmentCard, { getApptStatusKey } from "~/components/AppointmentCard";
import { ChevronLeft, ChevronRight, CalendarClock, CalendarDays } from "lucide-react";
import { fetchBookingsForBarber } from "~/services/bookingService";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";

function LichHen() {
  const { user, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const BARBER_ID = user?.idUser;

  const [calendarView, setCalendarView] = useState("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeDate = (dateStr) => dateStr.split("T")[0];
  const formatDate = (d) => d.toISOString().split("T")[0];

  const getDatesForApi = (date, view) => {
    let start = new Date(date);
    let end = new Date(date);

    if (view === "week") {
      const dayOfWeek = start.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - daysToSubtract);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    }
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    return { startStr, endStr };
  };

  useEffect(() => {
    if (isAuthLoading || !BARBER_ID) {
      if (!isAuthLoading) setLoading(false);
      return;
    }

    const loadBookings = async () => {
      setLoading(true);
      const { startStr, endStr } = getDatesForApi(currentDate, calendarView);

      try {
        const data = await fetchBookingsForBarber(BARBER_ID, startStr, endStr);
        setAppointments(data);
      } catch (err) {
        console.error("Lỗi tải lịch hẹn:", err);
        showToast({ text: "Không thể tải lịch hẹn. Vui lòng thử lại.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [currentDate, calendarView, BARBER_ID, isAuthLoading]);

  const handleViewChange = (e) => {
    setCalendarView(e.target.value);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (calendarView === "day") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (calendarView === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (calendarView === "day") {
      return currentDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } else {
      const { startStr, endStr } = getDatesForApi(currentDate, calendarView);
      const start = new Date(startStr);
      const end = new Date(endStr);
      return `${start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
    }
  };

  const getWeekAppointments = () => {
    const { startStr } = getDatesForApi(currentDate, "week");
    const start = new Date(startStr);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });

    return days.map((day) => {
      const appts = appointments.filter(
        (appt) => normalizeDate(appt.bookingDate) === formatDate(day)
      );
      return { day, appts };
    });
  };

  // ── Day view: sorted chronologically so the rail reads top-to-bottom ──
  const filteredAppointments =
    calendarView === "day"
      ? appointments
          .filter((appt) => normalizeDate(appt.bookingDate) === formatDate(currentDate))
          .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))
      : [];

  const isToday = formatDate(currentDate) === formatDate(new Date());
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const getApptMinutes = (appt) => {
    const d = new Date(appt.bookingDate);
    return d.getHours() * 60 + d.getMinutes();
  };

  // index of the next upcoming appointment today (first one starting after "now")
  const nextIdx = isToday
    ? filteredAppointments.findIndex((appt) => getApptMinutes(appt) > nowMinutes)
    : -1;

  // build the render list, injecting the "now" marker at the right spot
  const dayRows = [];
  if (calendarView === "day") {
    let markerInserted = false;
    filteredAppointments.forEach((appt, i) => {
      if (isToday && !markerInserted && getApptMinutes(appt) > nowMinutes) {
        dayRows.push({ type: "now" });
        markerInserted = true;
      }
      dayRows.push({ type: "appt", data: appt, isNext: i === nextIdx });
    });
    if (isToday && !markerInserted && filteredAppointments.length > 0) {
      dayRows.push({ type: "now" });
    }
  }

  const stats = {
    total: filteredAppointments.length,
    done: filteredAppointments.filter((a) => getApptStatusKey(a.status) === "completed").length,
    inProgress: filteredAppointments.filter((a) => getApptStatusKey(a.status) === "inprogress").length,
  };

  // TODO: wire this up to your real "update booking status" endpoint in bookingService.
  // For now this optimistically flips the card to "completed" and notifies the user.
  const handleComplete = (appt) => {
    setAppointments((prev) =>
      prev.map((a) => (a.idBooking === appt.idBooking ? { ...a, status: "completed" } : a))
    );
    showToast({ text: `Đã đánh dấu hoàn thành lịch hẹn của ${appt.customerName || appt.name || "khách"}.`, type: "success" });
  };

  if (isAuthLoading || loading) return (
    <div className={styles.loadingContainer}>
      <CalendarClock size={40} className={styles.loadingIcon} />
      <p>Đang tải lịch hẹn...</p>
    </div>
  );

  if (!BARBER_ID) return (
    <div className={styles.emptyContainer}>
      <p>Vui lòng đăng nhập để xem lịch hẹn.</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Lịch Hẹn Khách Hàng</h2>
        <select value={calendarView} onChange={handleViewChange} className={styles.select}>
          <option value="day">Theo Ngày</option>
          <option value="week">Theo Tuần</option>
        </select>
      </div>

      <div className={styles.navBar}>
        <div className={styles.navDate}>
          <button onClick={() => navigateDate("prev")} className={styles.navBtn}>
            <ChevronLeft size={16} />
          </button>
          <div className={styles.dateBlock}>
            <div className={styles.dateValue}>
              <CalendarDays size={13} />
              {getDateRangeText()}
            </div>
            {calendarView === "day" && (
              <div className={styles.dateWeekday}>
                {currentDate.toLocaleDateString("vi-VN", { weekday: "long" })}
              </div>
            )}
          </div>
          <button onClick={() => navigateDate("next")} className={styles.navBtn}>
            <ChevronRight size={16} />
          </button>
        </div>

        {calendarView === "day" && (
          <div className={styles.navStats}>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} ${styles.total}`}>{stats.total}</div>
              <div className={styles.statLabel}>Lịch hẹn</div>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} ${styles.done}`}>{stats.done}</div>
              <div className={styles.statLabel}>Hoàn thành</div>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} ${styles.progress}`}>{stats.inProgress}</div>
              <div className={styles.statLabel}>Đang phục vụ</div>
            </div>
          </div>
        )}
      </div>

      {/* Day View */}
      {calendarView === "day" && (
        <>
          {filteredAppointments.length > 0 ? (
            <div className={styles.timeline}>
              {dayRows.map((row, i) =>
                row.type === "now" ? (
                  <div className={styles.nowMarker} key={`now-${i}`}>
                    <span className={styles.nowLine} />
                    <span className={styles.nowLabel}>
                      Bây giờ · {now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ) : (
                  <AppointmentCard
                    key={row.data.idBooking}
                    appt={row.data}
                    view="day"
                    isNext={row.isNext}
                    onComplete={handleComplete}
                  />
                )
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>Không có lịch hẹn trong ngày này</div>
          )}
        </>
      )}

      {/* Week View */}
      {calendarView === "week" && (
        <div className={styles.weekGrid}>
          {getWeekAppointments().map(({ day, appts }) => (
            <div key={day.toDateString()} className={styles.weekCol}>
              <div className={styles.weekHeader}>
                {day.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric" })}
              </div>
              <div className={styles.weekAppts}>
                {appts.length > 0 ? (
                  appts.map((appt) => (
                    <AppointmentCard key={appt.idBooking} appt={appt} view="week" />
                  ))
                ) : (
                  <p className={styles.noAppt}>—</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LichHen;
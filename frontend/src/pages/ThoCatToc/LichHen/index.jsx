import React, { useState, useEffect } from "react";
import styles from "./LichHen.module.scss";
import AppointmentCard from "~/components/AppointmentCard";
import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { fetchBookingsForBarber } from "~/services/bookingService";
import { useAuth } from "~/context/AuthContext";

function LichHen() {
  const { user, loading: isAuthLoading } = useAuth();
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
    if (isAuthLoading || !BARBER_ID ) {
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

  const filteredAppointments =
    calendarView === "day"
      ? appointments.filter(
          (appt) => normalizeDate(appt.bookingDate) === formatDate(currentDate)
        )
      : [];

  if (isAuthLoading || loading) return (
    <div className={styles.loadingContainer}>
      <CalendarClock size={40} className={styles.loadingIcon} />
      <p>Đang tải lịch hẹn...</p>
    </div>
  );

  if (!BARBER_ID ) return (
    <div className={styles.emptyContainer}>
      <p>Vui lòng đăng nhập để xem lịch hẹn.</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Lịch Hẹn Khách Hàng</h2>
        <select
          value={calendarView}
          onChange={handleViewChange}
          className={styles.select}
        >
          <option value="day">Theo Ngày</option>
          <option value="week">Theo Tuần</option>
        </select>
      </div>

      <div className={styles.nav}>
        <button onClick={() => navigateDate("prev")} className={styles.navBtn}>
          <ChevronLeft size={20} />
        </button>
        <span className={styles.rangeText}>{getDateRangeText()}</span>
        <button onClick={() => navigateDate("next")} className={styles.navBtn}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day View */}
      {calendarView === "day" && (
        <div className={styles.list}>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appt) => (
              <AppointmentCard key={appt.idBooking} appt={appt} view="day" />
            ))
          ) : (
            <div className={styles.emptyState}>Không có lịch hẹn trong ngày này</div>
          )}
        </div>
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
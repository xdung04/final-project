import { useState, useEffect, useCallback } from "react";
import DefaultLayout from "../../layouts/DefaultLayout";
import styles from "./Booking.module.scss";
import VoucherPopup from "../../components/VoucherPopup";
import { fetchBookedSlots } from "~/services/bookingService";
import { useToast } from "~/context/ToastContext";
import {
  getCalendarLinkStatus,
  getGoogleAuthUrl,
} from "~/services/calendarService";
import { useAuth } from "~/context/AuthContext";
import ConfirmModal from "../../components/ComfirmModal/index";

function BookingPage() {
  const [booking, setBooking] = useState({
    branch: "",
    branchId: null,
    barber: "",
    barberId: null,
    date: "",
    time: "",
    services: [],
    discount: 0,
    voucher: null,
    idCustomerVoucher: null,
  });

  const { accessToken, user } = useAuth();
  const [isCheckingCalendar, setIsCheckingCalendar] = useState(false);

  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);

  const [branches, setBranches] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [times, setTimes] = useState([]);
  const [bookedTimesByDate, setBookedTimesByDate] = useState({});
  const [unavailableDates, setUnavailableDates] = useState([]);

  // ─── Vị trí người dùng ───────────────────────────────────────────────────
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);

  const today = new Date();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Huỷ",
    confirmType: "primary",
    onConfirm: null,
    onCancel: null,
  });
  const closeConfirmModal = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  // ─── Fetch chi nhánh (có hoặc không có tọa độ) ───────────────────────────
  const fetchBranches = useCallback(
    async (lat, lng) => {
      try {
        const params = lat && lng ? `?lat=${lat}&lng=${lng}` : "";
        const res = await fetch(`${API_BASE_URL}/bookings/branches${params}`);
        const data = await res.json();
        setBranches(data || []);
      } catch (err) {
        console.error("Error fetch branches:", err);
      }
    },
    [API_BASE_URL],
  );

  // ─── Lấy vị trí → fetch lại branches kèm khoảng cách ────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị.");
      fetchBranches();
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setHasLocation(true);
        setLocationLoading(false);
        fetchBranches(lat, lng); // BE tính distance + sort rồi trả về
      },
      () => {
        setLocationError("Không thể lấy vị trí. Vui lòng cho phép truy cập.");
        setLocationLoading(false);
        fetchBranches(); // vẫn load branches, chỉ không có distance
      },
      { timeout: 8000 },
    );
  }, [fetchBranches]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarStatus = urlParams.get("calendar");
    if (calendarStatus === "linked") {
      const newUrl =
        window.location.pathname +
        window.location.search
          .replace(/[?&]calendar=linked/, "")
          .replace(/^&/, "?");
      window.history.replaceState({}, "", newUrl);

      const savedBooking = sessionStorage.getItem("pendingBooking");
      if (savedBooking) {
        const bookingData = JSON.parse(savedBooking);
        setBooking(bookingData);
        sessionStorage.removeItem("pendingBooking");

        showToast({
          text: "Đã liên kết Google Calendar, đang tiến hành đặt lịch...",
          type: "info",
        });
        handleSubmitWithCalendarSync(true, bookingData);
      } else {
        showToast({
          text: "Liên kết Google Calendar thành công!",
          type: "success",
        });
      }
    } else if (calendarStatus === "error") {
      const msg =
        urlParams.get("message") || "Liên kết thất bại, vui lòng thử lại";
      showToast({ text: decodeURIComponent(msg), type: "error" });
      const newUrl =
        window.location.pathname +
        window.location.search
          .replace(/[?&]calendar=error[^&]*/, "")
          .replace(/^&/, "?");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Auto chạy khi vào trang
  useEffect(() => {
    requestLocation();
  }, []);

  // ─── Logic chọn chi nhánh (dùng chung cho card + select) ─────────────────
  const applyBranchSelection = useCallback(
    async (branchId) => {
      const selectedBranch = branches.find((b) => b.idBranch === branchId);

      setBooking((prev) => ({
        ...prev,
        branchId,
        branch: selectedBranch?.name || "",
        barber: "",
        barberId: null,
        services: [],
        time: "",
        date: "",
      }));

      if (!branchId) {
        setBarbers([]);
        setServices([]);
        setTimes([]);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/bookings/branches/${branchId}`,
        );
        const data = await res.json();

        setBarbers(data.barbers || []);
        setServices(data.services || []);

        if (data.openTime && data.closeTime && data.slotDuration) {
          const start = new Date(`2000-01-01T${data.openTime}`);
          const end = new Date(`2000-01-01T${data.closeTime}`);
          const slot = Number(data.slotDuration) || 60;
          const slots = [];
          for (
            let t = new Date(start);
            t < end;
            t = new Date(t.getTime() + slot * 60000)
          ) {
            slots.push(t.toTimeString().slice(0, 5));
          }
          setTimes(slots);
        } else {
          setTimes([]);
        }
      } catch (err) {
        console.error("Error fetch branch details:", err);
        setBarbers([]);
        setServices([]);
        setTimes([]);
      }
    },
    [branches, API_BASE_URL],
  );

  const handleSubmitWithCalendarSync = async (
    syncToCalendar,
    bookingDataOverride = null,
  ) => {
    const finalBooking = bookingDataOverride || booking;

    if (
      !finalBooking.branchId ||
      !finalBooking.barberId ||
      !finalBooking.date ||
      !finalBooking.time ||
      !finalBooking.services.length
    ) {
      showToast({ text: "Vui lòng điền đầy đủ thông tin!", type: "error" });
      return false;
    }

    setIsLoading(true);
    const totalPrice = finalBooking.services.reduce(
      (sum, s) => sum + Number(s.price),
      0,
    );
    const discountAmount = (totalPrice * finalBooking.discount) / 100;
    const finalPrice = totalPrice - discountAmount;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idBranch: finalBooking.branchId,
          idBarber: finalBooking.barberId,
          bookingDate: finalBooking.date,
          bookingTime: finalBooking.time,
          services: finalBooking.services.map((s) => ({
            idService: s.idService,
            price: s.price,
            quantity: 1,
          })),
          description: finalBooking.services.map((s) => s.name).join(", "),
          idCustomerVoucher: finalBooking.idCustomerVoucher || null,
          syncToCalendar,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Lỗi khi tạo booking");
      }

      showToast({
        text: `Đặt lịch thành công! Thành tiền: ${finalPrice.toLocaleString()}đ`,
        type: "success",
      });

      setTimeout(() => window.location.reload(), 2500);
      return true;
    } catch (err) {
      console.error(err);
      showToast({
        text: err.message || "Không thể kết nối server!",
        type: "error",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchChange = (e) => {
    applyBranchSelection(Number(e.target.value) || null);
  };

  const handleBranchCardClick = (branchId) => {
    applyBranchSelection(branchId);
  };

  // ─── Các handler còn lại ─────────────────────────────────────────────────
  const handleBarberChange = async (e) => {
    const barberId = Number(e.target.value) || null;
    const barber = barbers.find((b) => Number(b.idBarber) === barberId);
    setBooking({ ...booking, barberId, barber: barber?.user?.fullName || "" });

    if (!barberId || !booking.branchId || !booking.date) return;

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/barbers/${barberId}`);
      const data = await res.json();

      const grouped = {};
      data.bookedSlots?.forEach((time) => {
        const date = booking.date;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(time);
      });
      setBookedTimesByDate(grouped);

      const unava = [];
      data.unavailabilities?.forEach((u) => {
        const start = new Date(u.startDate);
        const end = new Date(u.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          unava.push(d.toISOString().split("T")[0]);
        }
      });
      setUnavailableDates(unava);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    }
  };

  useEffect(() => {
    if (unavailableDates.includes(booking.date)) {
      setBooking((prev) => ({ ...prev, date: "" }));
    }
  }, [unavailableDates]);

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setBooking((prev) => ({ ...prev, date }));

    if (!booking.barberId || !booking.branchId) return;

    try {
      const data = await fetchBookedSlots(
        booking.barberId,
        booking.branchId,
        date,
      );

      const grouped = { [date]: data.bookedSlots || [] };
      setBookedTimesByDate((prev) => ({ ...prev, ...grouped }));

      const unava = [];
      data.unavailabilities?.forEach((u) => {
        const start = new Date(u.startDate);
        const end = new Date(u.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          unava.push(d.toISOString().split("T")[0]);
        }
      });
      setUnavailableDates(unava);
    } catch (err) {
      console.error("Error fetching booked slots on date change:", err);
    }
  };

  const handleTimeSelect = (time) => {
    const bookedTimes = booking.date
      ? bookedTimesByDate[booking.date] || []
      : [];
    if (!bookedTimes.includes(time)) setBooking({ ...booking, time });
  };

  const handleServiceAdd = (e) => {
    const selectedId = Number(e.target.value) || null;
    const service = services.find((s) => Number(s.idService) === selectedId);
    if (
      service &&
      !booking.services.find(
        (s) => Number(s.idService) === Number(service.idService),
      )
    ) {
      setBooking({ ...booking, services: [...booking.services, service] });
    }
  };

  const handleRemoveService = (idService) =>
    setBooking({
      ...booking,
      services: booking.services.filter(
        (s) => Number(s.idService) !== Number(idService),
      ),
    });

  const handleVoucherSelect = (voucher) => {
    if (!voucher) {
      setBooking({
        ...booking,
        discount: 0,
        voucher: null,
        idCustomerVoucher: null,
      });
      setShowVoucherList(false);
      return;
    }
    setBooking({
      ...booking,
      discount: voucher.discount,
      voucher,
      idCustomerVoucher: voucher.idCustomerVoucher || null,
    });
    setShowVoucherList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!booking.branchId)
      return showToast({ text: "Vui lòng chọn cơ sở!", type: "error" });
    if (!booking.barberId)
      return showToast({ text: "Vui lòng chọn kỹ thuật viên!", type: "error" });
    if (!booking.date)
      return showToast({ text: "Vui lòng chọn ngày!", type: "error" });
    if (!booking.time)
      return showToast({ text: "Vui lòng chọn thời gian!", type: "error" });
    if (!booking.services.length)
      return showToast({
        text: "Vui lòng chọn ít nhất một dịch vụ!",
        type: "error",
      });

    if (!accessToken) {
      showToast({ text: "Vui lòng đăng nhập để đặt lịch!", type: "error" });
      return;
    }

    setIsCheckingCalendar(true);
    try {
      const calendarStatus = await getCalendarLinkStatus(accessToken);
      if (!calendarStatus.linked) {
        setConfirmModal({
          isOpen: true,
          title: "Liên kết Google Calendar",
          message:
            "Bạn chưa liên kết Google Calendar. Bạn có muốn liên kết để đồng bộ lịch hẹn vào Google Calendar không?",
          confirmText: "Liên kết",
          cancelText: "Bỏ qua",
          confirmType: "primary",
          onConfirm: () => {
            closeConfirmModal();
            sessionStorage.setItem("pendingBooking", JSON.stringify(booking));
            const returnUrl = window.location.pathname + window.location.search;
            getGoogleAuthUrl(accessToken, returnUrl).then((url) => {
              window.location.href = url;
            });
          },
          onCancel: () => {
            closeConfirmModal();
            handleSubmitWithCalendarSync(false);
          },
        });
      } else {
        await handleSubmitWithCalendarSync(true);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra calendar:", error);
      showToast({ text: "Có lỗi xảy ra, vui lòng thử lại sau", type: "error" });
    } finally {
      setIsCheckingCalendar(false);
    }
  };
  // ─── Tính giá ─────────────────────────────────────────────────────────────
  const totalPrice = booking.services.reduce(
    (sum, s) => sum + Number(s.price),
    0,
  );
  const discountAmount = (totalPrice * booking.discount) / 100;
  const finalPrice = totalPrice - discountAmount;
  const bookedTimes = booking.date ? bookedTimesByDate[booking.date] || [] : [];

  // ─── Helper trạng thái chi nhánh ──────────────────────────────────────────
  const getBranchStatus = (b) => {
    const now = new Date();
    if (b.suspendDate && !b.resumeDate) {
      const sd = new Date(b.suspendDate);
      if (sd > now)
        return {
          type: "warn",
          label: `Ngưng ${sd.toLocaleDateString("vi-VN")}`,
        };
    }
    if (b.resumeDate) {
      const rd = new Date(b.resumeDate);
      if (rd > now)
        return { type: "pause", label: `Mở ${rd.toLocaleDateString("vi-VN")}` };
    }
    return null;
  };

  return (
    <DefaultLayout>
      <div className={styles.bookingWrapper}>
        <div className={styles.grainOverlay}></div>
        <div className={styles.logoBarber}>
          <img src="/rau.png" alt="Barber Logo" />
        </div>

        <div className={styles.bookingContainer}>
          <h2>Đặt lịch Barber</h2>

          {/* ══════════════════════════════════════════
              BRANCH FINDER PANEL
          ══════════════════════════════════════════ */}
          <div className={styles.branchFinder}>
            <div className={styles.branchFinderHeader}>
              <span className={styles.branchFinderTitle}>
                Chi nhánh gần bạn
              </span>
              <button
                type="button"
                className={`${styles.locationBtn} ${
                  locationLoading ? styles.locationBtnLoading : ""
                }`}
                onClick={requestLocation}
                disabled={locationLoading}
              >
                <span className={styles.locationDot}></span>
                {locationLoading ? "Đang định vị..." : "Cập nhật vị trí"}
              </button>
            </div>

            {locationError && (
              <p className={styles.locationError}>{locationError}</p>
            )}

            {!hasLocation && !locationLoading && !locationError && (
              <p className={styles.locationHint}>
                Cho phép truy cập vị trí để xem chi nhánh gần nhất.
              </p>
            )}

            {/* Skeleton khi đang định vị lần đầu chưa có data */}
            {locationLoading && branches.length === 0 && (
              <div className={styles.branchCardList}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`${styles.branchCard} ${styles.branchCardSkeleton}`}
                  />
                ))}
              </div>
            )}

            {branches.length > 0 && (
              <div className={styles.branchCardList}>
                {/* Thay thế đoạn .map cũ bằng đoạn này */}
                {branches.map((b, idx) => {
                  const isNearest =
                    hasLocation && b.distanceM != null && idx === 0;
                  const isSelected = booking.branchId === b.idBranch;
                  const status = getBranchStatus(b);

                  return (
                    <div
                      key={b.idBranch}
                      className={`${styles.branchCard} 
        ${isSelected ? styles.branchCardSelected : ""} 
        ${isNearest ? styles.branchCardNearest : ""}`}
                      onClick={() => handleBranchCardClick(b.idBranch)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleBranchCardClick(b.idBranch)
                      }
                    >
                      {/* 1. Phần Badge */}
                      {isNearest && (
                        <span className={styles.nearestBadge}>Gần nhất</span>
                      )}
                      {isSelected && (
                        <span className={styles.selectedBadge}>✓ Đã chọn</span>
                      )}

                      {/* 2. Nội dung chính */}
                      <div className={styles.branchCardName}>{b.name}</div>

                      {b.address && (
                        <div className={styles.branchCardAddr}>
                          {/* Thêm icon ghim vị trí cho chuyên nghiệp */}
                          📍 {b.address}
                        </div>
                      )}

                      {/* 3. Phần thông tin bổ trợ (Meta) */}
                      <div className={styles.branchCardMeta}>
                        {b.distanceText && (
                          <span className={styles.chipDist}>
                            📏 {b.distanceText}
                          </span>
                        )}
                        {b.durationText && (
                          <span className={styles.chipTime}>
                            🚗 {b.durationText}
                          </span>
                        )}

                        {!b.distanceText && !locationLoading && (
                          <span className={styles.chipNoLoc}>— km</span>
                        )}

                        {status && (
                          <span
                            className={
                              status.type === "warn"
                                ? styles.chipWarn
                                : styles.chipPause
                            }
                          >
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* ══ end Branch Finder ══ */}

          <form onSubmit={handleSubmit}>
            {/* Cơ sở */}
            <div className={styles.formGroup}>
              <label>Cơ sở đã chọn:</label>
              <select
                value={booking.branchId || ""}
                onChange={handleBranchChange}
              >
                <option value="">-- Hoặc chọn từ danh sách --</option>
                {branches.map((b) => {
                  const suspend = b.suspendDate
                    ? new Date(b.suspendDate).toLocaleDateString("vi-VN")
                    : null;
                  const resume = b.resumeDate
                    ? new Date(b.resumeDate).toLocaleDateString("vi-VN")
                    : null;
                  let label = b.name;
                  if (suspend && !resume) label += ` — (ngưng từ ${suspend})`;
                  if (resume && new Date(b.resumeDate) > new Date())
                    label += ` — (mở từ ${resume})`;
                  return (
                    <option key={b.idBranch} value={b.idBranch}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Barber */}
            <div className={styles.formGroup}>
              <label>Kỹ thuật viên:</label>
              <select
                value={booking.barberId || ""}
                onChange={handleBarberChange}
                disabled={!barbers.length}
              >
                <option value="">-- Chọn barber --</option>
                {barbers.map((barber) => (
                  <option key={barber.idBarber} value={barber.idBarber}>
                    {barber.user?.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Ngày */}

            <div className={styles.formGroup}>
              <label>Ngày hẹn:</label>
              <div className={styles.dateList}>
                {[...Array(8)].map((_, i) => {
                  const d = new Date();
                  d.setDate(today.getDate() + i);
                  const value = d.toISOString().split("T")[0];

                  // Lấy thứ (T2, T3...) hoặc hiển thị 'Hôm nay'
                  const dayLabel =
                    i === 0
                      ? "Hôm nay"
                      : d.toLocaleDateString("vi-VN", { weekday: "short" });

                  // Lấy ngày và tháng
                  const dateNum = d.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                  });
                  const monthNum = d.toLocaleDateString("vi-VN", {
                    month: "2-digit",
                  });

                  const isUnavailable = unavailableDates.includes(value);
                  const isSelected = booking.date === value;

                  return (
                    <div
                      key={i}
                      className={`${styles.dateCard} 
            ${isSelected ? styles.dateCardSelected : ""} 
            ${isUnavailable ? styles.dateCardDisabled : ""}`}
                      onClick={() => {
                        if (!isUnavailable) {
                          // Gọi lại hàm handleDateChange với định dạng event giả lập
                          handleDateChange({ target: { value } });
                        }
                      }}
                    >
                      <span className={styles.dateDay}>{dayLabel}</span>
                      <span className={styles.dateNumber}>{dateNum}</span>
                      <span className={styles.dateMonth}>Tháng {monthNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thời gian */}
            <div className={styles.formGroup}>
              <label>Thời gian:</label>
              <div className={styles.timeGrid}>
                {times.map((time, i) => {
                  let isPast = false;
                  if (booking.date) {
                    const todayStr = today.toISOString().split("T")[0];
                    if (booking.date === todayStr) {
                      const [hh, mm] = time.split(":").map(Number);
                      const slotDate = new Date(today);
                      slotDate.setHours(hh, mm, 0, 0);
                      if (slotDate < today) isPast = true;
                    }
                  }
                  const isBooked = bookedTimes.includes(time);
                  const disabled = isBooked || isPast || !booking.date;

                  return (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.timeSlot}
                        ${isBooked || isPast ? styles.booked : ""}
                        ${booking.time === time ? styles.selected : ""}`}
                      onClick={() => handleTimeSelect(time)}
                      disabled={disabled}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dịch vụ */}
            <div className={styles.formGroup}>
              <label>Dịch vụ:</label>
              <select onChange={handleServiceAdd} value="">
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((s) => (
                  <option
                    key={s.idService}
                    value={s.idService}
                    disabled={s.status === "Inactive"}
                  >
                    {s.status === "Inactive"
                      ? `${s.name} - Đang cập nhật...`
                      : `${s.name} - ${Number(s.price).toLocaleString()}đ`}
                  </option>
                ))}
              </select>
              <ul className={styles.serviceList}>
                {booking.services.map((s) => (
                  <li key={s.idService}>
                    {s.name} - {Number(s.price).toLocaleString()}đ
                    <button
                      type="button"
                      onClick={() => handleRemoveService(s.idService)}
                    >
                      X
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tổng giá */}
            <div className={styles.summary}>
              <p>Tạm tính: {totalPrice.toLocaleString()}đ</p>
              <p>Giảm giá: -{discountAmount.toLocaleString()}đ</p>
              <p>
                <b>Thành tiền: {finalPrice.toLocaleString()}đ</b>
              </p>
              {booking.voucher && (
                <div className={styles.appliedVoucher}>
                  <p>
                    <strong>Voucher đang áp dụng:</strong>{" "}
                    {booking.voucher.title}
                  </p>
                  <p>Giảm: {booking.voucher.discount}%</p>
                  <p>Điểm cần: {booking.voucher.pointCost}</p>
                </div>
              )}
              <button type="button" onClick={() => setShowVoucherList(true)}>
                Áp dụng mã giảm
              </button>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading || isCheckingCalendar}
            >
              {isLoading
                ? "Đang xử lý..."
                : isCheckingCalendar
                  ? "Đang kiểm tra..."
                  : "Xác nhận đặt lịch"}
            </button>
          </form>
        </div>

        <img
          src="/keo.png"
          alt="Left Scissors"
          className={styles.scissorsLeft}
        />
        <img
          src="/keo.png"
          alt="Right Scissors"
          className={styles.scissorsRight}
        />

        {showVoucherList && (
          <VoucherPopup
            onClose={() => setShowVoucherList(false)}
            onSelect={handleVoucherSelect}
            defaultVoucher={booking.voucher}
          />
        )}
      </div>

      {isLoading && (
        <div className={styles.overlay}>
          <div className={styles.loader}></div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        confirmType={confirmModal.confirmType}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
    </DefaultLayout>
  );
}

export default BookingPage;

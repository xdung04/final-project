import { useState, useEffect, useCallback, useRef } from "react";
import DefaultLayout from "../../layouts/DefaultLayout";
import styles from "./Booking.module.scss";
import VoucherPopup, { calcActualDiscount } from "../../components/VoucherPopup";
import { fetchBookedSlots,createBooking } from "~/services/bookingService";
import { useToast } from "~/context/ToastContext";
import { getCalendarLinkStatus, getGoogleAuthUrl } from "~/services/calendarService";
import { useAuth } from "~/context/AuthContext";
import ConfirmModal from "../../components/ComfirmModal/index";
import { hairStyleAPI } from "~/apis/hairStyleAPI";

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
    discountFixed: 0,
    voucher: null,
    idCustomerVoucher: null,
    silentMode: false,
    hairstyleId: null,
  });

  const [hairstylesData, setHairstylesData] = useState([]);
  const { isLogin } = useAuth();
  const [isCheckingCalendar, setIsCheckingCalendar] = useState(false);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [showHairstylePanel, setShowHairstylePanel] = useState(false);
  const hairstylePanelRef = useRef(null);
  const [voucherWarning, setVoucherWarning] = useState("");

  const [branches, setBranches] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [times, setTimes] = useState([]);
  const [bookedTimesByDate, setBookedTimesByDate] = useState({});
  const [unavailableDates, setUnavailableDates] = useState([]);

  // [FIX] Thêm state barberLockDate để block ngày từ lockDate trở đi
  const [barberLockDate, setBarberLockDate] = useState(null);

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
  const closeConfirmModal = () => setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  const formatMoney = (val) => Number(val).toLocaleString("vi-VN") + "đ";

  const recalculateDiscount = useCallback((cv, currentTotal) => {
    if (!cv) return { discountPercent: 0, discountFixed: 0 };
    const vd = cv.voucher || cv;
    let discountPercent = 0;
    let discountFixed = 0;

    if (vd.discount_amount && Number(vd.discount_amount) > 0) {
      discountFixed = Math.min(Number(vd.discount_amount), currentTotal);
      if (vd.max_discount_amount && discountFixed > Number(vd.max_discount_amount)) {
        discountFixed = Number(vd.max_discount_amount);
      }
    } else if (vd.discount_percent) {
      discountPercent = Number(vd.discount_percent);
    }
    return { discountPercent, discountFixed };
  }, []);

  const voucherRef = useRef(booking.voucher);
  useEffect(() => {
    voucherRef.current = booking.voucher;
  }, [booking.voucher]);

  useEffect(() => {
    const cv = voucherRef.current;

    if (!cv) {
      setVoucherWarning("");
      return;
    }

    const currentTotal = booking.services.reduce((sum, s) => sum + Number(s.price), 0);
    const vd = cv?.voucher || cv;
    const minInvoice = Number(vd?.min_invoice_amount || 0);

    if (minInvoice > 0 && currentTotal < minInvoice) {
      setBooking((prev) => ({
        ...prev,
        discount: 0,
        discountFixed: 0,
        voucher: null,
        idCustomerVoucher: null,
      }));
      setVoucherWarning(
        `Voucher "${vd?.name}" đã bị bỏ do đơn chưa đạt tối thiểu ${Number(minInvoice).toLocaleString()}đ`,
      );
    } else {
      setVoucherWarning("");
      const { discountPercent, discountFixed } = recalculateDiscount(cv, currentTotal);
      setBooking((prev) => ({
        ...prev,
        discount: discountPercent,
        discountFixed,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.services]);

  useEffect(() => {
    const handler = (e) => {
      if (hairstylePanelRef.current && !hairstylePanelRef.current.contains(e.target)) {
        setShowHairstylePanel(false);
      }
    };
    if (showHairstylePanel) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showHairstylePanel]);

  const buildDescription = (b) => {
    const parts = [];
    if (b.services.length) parts.push(b.services.map((s) => s.name).join(", "));
    if (b.hairstyleId) {
      const hs = hairstylesData.find((h) => h.idHairstyle === b.hairstyleId);
      if (hs) parts.push(`Kiểu tóc: ${hs.name}`);
    }
    if (b.silentMode) parts.push("Khách yêu cầu giữ im lặng khi đang làm dịch vụ");
    return parts.join(" | ");
  };

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

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị.");
      fetchBranches();
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setHasLocation(true);
        setLocationLoading(false);
        fetchBranches(lat, lng);
      },
      () => {
        setLocationError("Không thể lấy vị trí. Vui lòng cho phép truy cập.");
        setLocationLoading(false);
        fetchBranches();
      },
      { timeout: 8000 },
    );
  }, [fetchBranches]);

  useEffect(() => {
    const loadHairstyles = async () => {
      try {
        const res = await hairStyleAPI.getClientCategoriesWithHairstyles();
        if (res && res.length > 0) {
          const allHairstyles = [];
          res.forEach((cat) => {
            if (cat.hairstyles && cat.hairstyles.length > 0) {
              cat.hairstyles.forEach((hair) => allHairstyles.push(hair));
            }
          });
          setHairstylesData(allHairstyles);
        }
      } catch (error) {
        console.error("Lỗi khi fetch kiểu tóc trong Booking:", error);
      }
    };
    loadHairstyles();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarStatus = urlParams.get("calendar");
    if (calendarStatus === "linked") {
      const newUrl =
        window.location.pathname + window.location.search.replace(/[?&]calendar=linked/, "").replace(/^&/, "?");
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
      const msg = urlParams.get("message") || "Liên kết thất bại, vui lòng thử lại";
      showToast({ text: decodeURIComponent(msg), type: "error" });
      const newUrl =
        window.location.pathname + window.location.search.replace(/[?&]calendar=error[^&]*/, "").replace(/^&/, "?");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, []);

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
      // [FIX] Reset lock/unavail khi đổi chi nhánh
      setBarberLockDate(null);
      setUnavailableDates([]);
      setBookedTimesByDate({});

      if (!branchId) {
        setBarbers([]);
        setServices([]);
        setTimes([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/branches/${branchId}`);
        const data = await res.json();
      
        setBarbers(data.barbers || []);
        setServices(data.services || []);
        if (data.openTime && data.closeTime && data.slotDuration) {
          const start = new Date(`2000-01-01T${data.openTime}`);
          const end = new Date(`2000-01-01T${data.closeTime}`);
          const slot = Number(data.slotDuration) || 60;
          const slots = [];
          for (let t = new Date(start); t < end; t = new Date(t.getTime() + slot * 60000))
            slots.push(t.toTimeString().slice(0, 5));
          setTimes(slots);
        } else {
          setTimes([]);
        }
      } catch (err) {
        console.error(err);
        setBarbers([]);
        setServices([]);
        setTimes([]);
      }
    },
    [branches, API_BASE_URL],
  );

  const handleSubmitWithCalendarSync = async (syncToCalendar, bookingDataOverride = null) => {
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
try {
  await createBooking({
    idBranch: finalBooking.branchId,
    idBarber: finalBooking.barberId,
    bookingDate: finalBooking.date,
    bookingTime: finalBooking.time,
    services: finalBooking.services.map((s) => ({
      idService: s.idService,
      price: s.price,
      quantity: 1,
    })),
    description: buildDescription(finalBooking),
    idCustomerVoucher: finalBooking.idCustomerVoucher || null,
    syncToCalendar,
  });
  showToast({ text: "Đặt lịch thành công!", type: "success" });
  setTimeout(() => window.location.reload(), 2500);
  return true;
} catch (err) {
      showToast({
        text: err.message || "Không thể kết nối server!",
        type: "error",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchChange = (e) => applyBranchSelection(Number(e.target.value) || null);
  const handleBranchCardClick = (branchId) => applyBranchSelection(branchId);

  // [FIX] Sửa lại handleBarberChange — gọi đúng API unavailability, xử lý lockDate
  const handleBarberChange = async (e) => {
    const barberId = Number(e.target.value) || null;
    const barber = barbers.find((b) => Number(b.idBarber) === barberId);

    setBooking((prev) => ({
      ...prev,
      barberId,
      barber: barber?.user?.fullName || "",
      date: "", // reset ngày khi đổi barber
      time: "", // reset giờ khi đổi barber
    }));

    // Reset state liên quan đến barber cũ
    setUnavailableDates([]);
    setBarberLockDate(null);
    setBookedTimesByDate({});

    if (!barberId) return;

    // [FIX] Đọc lockDate từ barber object (đã có từ getBranchDetails sau khi fix backend)
    if (barber?.lockDate) {
      setBarberLockDate(barber.lockDate);
    }


  };

  // [FIX] Khi unavailableDates thay đổi, reset date nếu ngày đã chọn bị block
  useEffect(() => {
    if (booking.date && unavailableDates.includes(booking.date)) {
      setBooking((prev) => ({ ...prev, date: "" }));
    }
  }, [unavailableDates]);

  // [FIX] Khi barberLockDate thay đổi, reset date nếu ngày đã chọn >= lockDate
  useEffect(() => {
    if (booking.date && barberLockDate) {
      const lockDay = new Date(barberLockDate);
      lockDay.setHours(0, 0, 0, 0);
      const selectedDay = new Date(booking.date);
      selectedDay.setHours(0, 0, 0, 0);
      if (selectedDay >= lockDay) {
        setBooking((prev) => ({ ...prev, date: "", time: "" }));
        showToast({
          text: `Thợ này sẽ nghỉ từ ngày ${new Date(barberLockDate).toLocaleDateString(
            "vi-VN",
          )}. Vui lòng chọn ngày khác.`,
          type: "warning",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberLockDate]);

  const handleDateChange = async (dateValue) => {
    setBooking((prev) => ({ ...prev, date: dateValue, time: "" }));
    if (!booking.barberId || !booking.branchId) return;
    try {
      const data = await fetchBookedSlots(booking.barberId, booking.branchId, dateValue);
      setBookedTimesByDate((prev) => ({
        ...prev,
        [dateValue]: data.bookedSlots || [],
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTimeSelect = (time) => {
    const booked = booking.date ? bookedTimesByDate[booking.date] || [] : [];
    if (!booked.includes(time)) setBooking({ ...booking, time });
  };

  const handleServiceAdd = (e) => {
    const selectedId = Number(e.target.value) || null;
    const service = services.find((s) => Number(s.idService) === selectedId);
    if (service && !booking.services.find((s) => Number(s.idService) === Number(service.idService)))
      setBooking({ ...booking, services: [...booking.services, service] });
  };

  const handleRemoveService = (idService) =>
    setBooking({
      ...booking,
      services: booking.services.filter((s) => Number(s.idService) !== Number(idService)),
    });

  const handleVoucherSelect = (cv) => {
    setVoucherWarning("");

    if (!cv) {
      setBooking((prev) => ({
        ...prev,
        discount: 0,
        discountFixed: 0,
        voucher: null,
        idCustomerVoucher: null,
      }));
      setShowVoucherList(false);
      return;
    }

    const currentTotal = booking.services.reduce((sum, s) => sum + Number(s.price), 0);
    const { discountPercent, discountFixed } = recalculateDiscount(cv, currentTotal);

    setBooking((prev) => ({
      ...prev,
      discount: discountPercent,
      discountFixed,
      voucher: cv,
      idCustomerVoucher: cv.id || null,
    }));
    setShowVoucherList(false);
  };

  const handleHairstyleSelect = (id) => {
    setBooking((prev) => ({
      ...prev,
      hairstyleId: prev.hairstyleId === id ? null : id,
    }));
    setShowHairstylePanel(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking.branchId) return showToast({ text: "Vui lòng chọn cơ sở!", type: "error" });
    if (!booking.barberId) return showToast({ text: "Vui lòng chọn kỹ thuật viên!", type: "error" });
    if (!booking.date) return showToast({ text: "Vui lòng chọn ngày!", type: "error" });
    if (!booking.time) return showToast({ text: "Vui lòng chọn thời gian!", type: "error" });
    if (!booking.services.length)
      return showToast({
        text: "Vui lòng chọn ít nhất một dịch vụ!",
        type: "error",
      });
    if (!isLogin) {
      showToast({ text: "Vui lòng đăng nhập để đặt lịch!", type: "error" });
      return;
    }

    // [FIX] Validate lockDate lần nữa trước khi submit (guard cuối)
    if (barberLockDate) {
      const lockDay = new Date(barberLockDate);
      lockDay.setHours(0, 0, 0, 0);
      const selectedDay = new Date(booking.date);
      selectedDay.setHours(0, 0, 0, 0);
      if (selectedDay >= lockDay) {
        showToast({
          text: `Thợ này sẽ nghỉ từ ngày ${new Date(barberLockDate).toLocaleDateString(
            "vi-VN",
          )}. Vui lòng chọn ngày trước đó.`,
          type: "error",
        });
        return;
      }
    }

    setIsCheckingCalendar(true);
    try {
      const calendarStatus = await getCalendarLinkStatus();
      if (!calendarStatus.linked) {
        setConfirmModal({
          isOpen: true,
          title: "Liên kết Google Calendar",
          message: "Bạn chưa liên kết Google Calendar. Bạn có muốn liên kết để đồng bộ lịch hẹn không?",
          confirmText: "Liên kết",
          cancelText: "Bỏ qua",
          confirmType: "primary",
          onConfirm: () => {
            closeConfirmModal();
            sessionStorage.setItem("pendingBooking", JSON.stringify(booking));
            const returnUrl = window.location.pathname + window.location.search;
            getGoogleAuthUrl( returnUrl).then((url) => {
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
      showToast({
        text: "Có lỗi xảy ra, vui lòng thử lại sau",
        type: "error",
      });
    } finally {
      setIsCheckingCalendar(false);
    }
  };

  const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.price), 0);
  const discountAmt = booking.discountFixed > 0 ? booking.discountFixed : (totalPrice * (booking.discount || 0)) / 100;
  const finalPrice = Math.max(0, totalPrice - discountAmt);
  const bookedTimes = booking.date ? bookedTimesByDate[booking.date] || [] : [];
  const selectedStyle = hairstylesData.find((h) => h.idHairstyle === booking.hairstyleId);

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
        return {
          type: "pause",
          label: `Mở ${rd.toLocaleDateString("vi-VN")}`,
        };
    }
    return null;
  };

  // [FIX] Helper tính xem ngày có bị block vì lockDate không
  const isDateBlockedByLock = (dateValue) => {
    if (!barberLockDate) return false;
    const lockDay = new Date(barberLockDate);
    lockDay.setHours(0, 0, 0, 0);
    const checkDay = new Date(dateValue);
    checkDay.setHours(0, 0, 0, 0);
    return checkDay >= lockDay;
  };

  return (
    <DefaultLayout>
      <div className={styles.bookingWrapper}>
        <div className={styles.grainOverlay} />
        <div className={styles.logoBarber}>
          <img src="/rau.png" alt="Barber Logo" />
        </div>

        <div className={styles.bookingContainer}>
          <h2>Đặt lịch Barber</h2>

          {/* ── Branch Finder ── */}
          <div className={styles.branchFinder}>
            <div className={styles.branchFinderHeader}>
              <span className={styles.branchFinderTitle}>Chi nhánh gần bạn</span>
              <button
                type="button"
                className={`${styles.locationBtn} ${locationLoading ? styles.locationBtnLoading : ""}`}
                onClick={requestLocation}
                disabled={locationLoading}
              >
                <span className={styles.locationDot} />
                {locationLoading ? "Đang định vị..." : "Cập nhật vị trí"}
              </button>
            </div>
            {locationError && <p className={styles.locationError}>{locationError}</p>}
            {!hasLocation && !locationLoading && !locationError && (
              <p className={styles.locationHint}>Cho phép truy cập vị trí để xem chi nhánh gần nhất.</p>
            )}
            {locationLoading && branches.length === 0 && (
              <div className={styles.branchCardList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`${styles.branchCard} ${styles.branchCardSkeleton}`} />
                ))}
              </div>
            )}
            {branches.length > 0 && (
              <div className={styles.branchCardList}>
                {branches.map((b, idx) => {
                  const isNearest = hasLocation && b.distanceM != null && idx === 0;
                  const isSelected = booking.branchId === b.idBranch;
                  const status = getBranchStatus(b);
                  return (
                    <div
                      key={b.idBranch}
                      className={`${styles.branchCard} ${
                        isSelected ? styles.branchCardSelected : ""
                      } ${isNearest ? styles.branchCardNearest : ""}`}
                      onClick={() => handleBranchCardClick(b.idBranch)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleBranchCardClick(b.idBranch)}
                    >
                      {isNearest && <span className={styles.nearestBadge}>Gần nhất</span>}
                      {isSelected && <span className={styles.selectedBadge}>✓ Đã chọn</span>}
                      <div className={styles.branchCardName}>{b.name}</div>
                      {b.address && <div className={styles.branchCardAddr}>📍 {b.address}</div>}
                      <div className={styles.branchCardMeta}>
                        {b.distanceText && <span className={styles.chipDist}>📏 {b.distanceText}</span>}
                        {b.durationText && <span className={styles.chipTime}>🚗 {b.durationText}</span>}
                        {!b.distanceText && !locationLoading && <span className={styles.chipNoLoc}>— km</span>}
                        {status && (
                          <span className={status.type === "warn" ? styles.chipWarn : styles.chipPause}>
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

          <form onSubmit={handleSubmit}>
            {/* ── Cơ sở ── */}
            <div className={styles.formGroup}>
              <label>Cơ sở đã chọn</label>
              <div className={styles.selectWrapper}>
                <select value={booking.branchId || ""} onChange={handleBranchChange}>
                  <option value="">— Hoặc chọn từ danh sách —</option>
                  {branches.map((b) => {
                    const suspend = b.suspendDate ? new Date(b.suspendDate).toLocaleDateString("vi-VN") : null;
                    const resume = b.resumeDate ? new Date(b.resumeDate).toLocaleDateString("vi-VN") : null;
                    let label = b.name;
                    if (suspend && !resume) label += ` — (ngưng từ ${suspend})`;
                    if (resume && new Date(b.resumeDate) > new Date()) label += ` — (mở từ ${resume})`;
                    return (
                      <option key={b.idBranch} value={b.idBranch}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <span className={styles.selectArrow}>▾</span>
              </div>
            </div>

            {/* ── Barber ── */}
            <div className={styles.formGroup}>
              <label>Kỹ thuật viên</label>
              <div className={styles.selectWrapper}>
                <select value={booking.barberId || ""} onChange={handleBarberChange} disabled={!barbers.length}>
                  <option value="">— Chọn barber —</option>
                  {/* [FIX] Hiển thị thêm thông tin lockDate trong option */}
                  {barbers.map((barber) => {
                    const lockLabel = barber.lockDate
                      ? ` (nghỉ từ ${new Date(barber.lockDate).toLocaleDateString("vi-VN")})`
                      : "";
                    return (
                      <option key={barber.idBarber} value={barber.idBarber}>
                        {barber.user?.fullName}
                        {lockLabel}
                      </option>
                    );
                  })}
                </select>
                <span className={styles.selectArrow}>▾</span>
              </div>
              {/* [FIX] Hiển thị warning nếu barber có lockDate */}
              {barberLockDate && (
                <p style={{ fontSize: 12, color: "#e69d9d", marginTop: 6 }}>
                  ⚠ Thợ này sẽ nghỉ từ ngày {new Date(barberLockDate).toLocaleDateString("vi-VN")} — chỉ có thể đặt lịch
                  trước ngày đó.
                </p>
              )}
            </div>

            {/* ── Ngày ── */}
            <div className={styles.formGroup}>
              <label>Ngày hẹn</label>
              <div className={styles.dateList}>
                {[...Array(14)].map((_, i) => {
                  // [FIX] Tăng lên 14 ngày để thấy rõ hiệu ứng block lockDate
                  const d = new Date();
                  d.setDate(today.getDate() + i);
                  const value = d.toISOString().split("T")[0];
                  const dayLabel = i === 0 ? "Hôm nay" : d.toLocaleDateString("vi-VN", { weekday: "short" });
                  const dateNum = d.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                  });
                  const monthNum = d.toLocaleDateString("vi-VN", {
                    month: "2-digit",
                  });
                  const isUnavail = unavailableDates.includes(value);
                  // [FIX] Check lockDate
                  const isLockedDate = isDateBlockedByLock(value);
                  const isDisabled = isUnavail || isLockedDate;
                  const isSelected = booking.date === value;

                  return (
                    <div
                      key={i}
                      title={
                        isLockedDate
                          ? `Thợ nghỉ từ ${new Date(barberLockDate).toLocaleDateString("vi-VN")}`
                          : isUnavail
                            ? "Thợ không làm việc ngày này"
                            : ""
                      }
                      className={`${styles.dateCard} ${
                        isSelected ? styles.dateCardSelected : ""
                      } ${isDisabled ? styles.dateCardDisabled : ""}`}
                      style={isLockedDate && !isUnavail ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                      onClick={() => {
                        if (!isDisabled) handleDateChange(value);
                      }}
                    >
                      <span className={styles.dateDay}>{dayLabel}</span>
                      <span className={styles.dateNumber}>{dateNum}</span>
                      <span className={styles.dateMonth}>Tháng {monthNum}</span>
                      {/* [FIX] Badge "Nghỉ" cho lockDate */}
                      {isLockedDate && (
                        <span
                          style={{
                            position: "absolute",
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#a32d2d",
                            background: "rgba(255,0,0,0.1)",
                            padding: "1px 5px",
                            borderRadius: 4,
                            bottom: 6,
                          }}
                        >
                          Nghỉ
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Thời gian ── */}
            <div className={styles.formGroup}>
              <label>Thời gian</label>
              <div className={styles.timeGrid}>
                {times.map((time, i) => {
                  let isPast = false;
                  if (booking.date === today.toISOString().split("T")[0]) {
                    const [hh, mm] = time.split(":").map(Number);
                    const slot = new Date(today);
                    slot.setHours(hh, mm, 0, 0);
                    if (slot < today) isPast = true;
                  }
                  const isBooked = bookedTimes.includes(time);
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.timeSlot} ${
                        isBooked || isPast ? styles.booked : ""
                      } ${booking.time === time ? styles.selected : ""}`}
                      onClick={() => handleTimeSelect(time)}
                      disabled={isBooked || isPast || !booking.date}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Dịch vụ ── */}
            <div className={styles.formGroup}>
              <label>Dịch vụ</label>
              <div className={styles.selectWrapper}>
                <select onChange={handleServiceAdd} value="">
                  <option value="">— Chọn dịch vụ —</option>
                  {services.map((s) => (
                    <option key={s.idService} value={s.idService} disabled={s.status === "Inactive"}>
                      {s.status === "Inactive"
                        ? `${s.name} - Đang cập nhật...`
                        : `${s.name} - ${Number(s.price).toLocaleString()}đ`}
                    </option>
                  ))}
                </select>
                <span className={styles.selectArrow}>▾</span>
              </div>
              <ul className={styles.serviceList}>
                {booking.services.map((s) => (
                  <li key={s.idService}>
                    <span>
                      {s.name} — {Number(s.price).toLocaleString()}đ
                    </span>
                    <button type="button" onClick={() => handleRemoveService(s.idService)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Kiểu tóc ── */}
            <div className={styles.formGroup}>
              <label>Kiểu tóc</label>

              <button type="button" className={styles.hairstyleTrigger} onClick={() => setShowHairstylePanel(true)}>
                <span className={styles.hairstyleTriggerText}>
                  {selectedStyle ? (
                    <>
                      Đã chọn: <strong>{selectedStyle.name}</strong> — Nhấn để đổi
                    </>
                  ) : (
                    "Chọn kiểu tóc phù hợp với bạn (tuỳ chọn)"
                  )}
                </span>
                <span className={styles.hairstyleTriggerArrow}>›</span>
              </button>

              {showHairstylePanel && (
                <div
                  className={styles.hairstyleOverlay}
                  onMouseDown={(e) => e.target === e.currentTarget && setShowHairstylePanel(false)}
                >
                  <div className={styles.hairstyleModal} ref={hairstylePanelRef}>
                    <div className={styles.hairstyleModalHeader}>
                      <div>
                        <h3>Chọn Kiểu Tóc</h3>
                        <p className={styles.hairstyleModalHint}>Chọn một kiểu tóc phù hợp với phong cách của bạn</p>
                      </div>
                      <button
                        type="button"
                        className={styles.hairstyleModalClose}
                        onClick={() => setShowHairstylePanel(false)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className={styles.hairstyleGrid}>
                      {hairstylesData.map((hs) => {
                        const isSelected = booking.hairstyleId === hs.idHairstyle;
                        return (
                          <div
                            key={hs.idHairstyle}
                            className={`${styles.hairstyleCard} ${isSelected ? styles.hairstyleCardSelected : ""}`}
                            onClick={() => {
                              setBooking((prev) => ({
                                ...prev,
                                hairstyleId: prev.hairstyleId === hs.idHairstyle ? null : hs.idHairstyle,
                              }));
                            }}
                          >
                            <div className={styles.hairstyleImgWrap}>
                              <img
                                src={hs.coverImage}
                                alt={hs.name}
                                className={styles.hairstyleCoverImg}
                                onError={(e) => {
                                  e.target.src = `https://via.placeholder.com/400x400/2c2c2c/ffffff?text=${encodeURIComponent(
                                    hs.name,
                                  )}`;
                                }}
                              />
                              {hs.sideImage && (
                                <img
                                  src={hs.sideImage}
                                  alt={`${hs.name} - góc nghiêng`}
                                  className={styles.hairstyleSideImg}
                                  onError={(e) => (e.target.style.display = "none")}
                                />
                              )}
                              {isSelected && <div className={styles.hairstyleSelectedTick}>✓</div>}
                            </div>
                            <div className={styles.hairstyleCardInfo}>
                              <h4>{hs.name}</h4>
                              <p>{hs.shortDescription || "Kiểu tóc hiện đại, phong cách lịch lãm."}</p>
                              {(hs.difficultyLevel || hs.suitableAge) && (
                                <div className={styles.hairstyleCardMeta}>
                                  {hs.difficultyLevel && (
                                    <span className={styles.hairstyleMetaTag}>{hs.difficultyLevel}</span>
                                  )}
                                  {hs.suitableAge && <span className={styles.hairstyleMetaTag}>{hs.suitableAge}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.hairstyleModalFooter}>
                      <div className={styles.hairstyleFooterSelected}>
                        {booking.hairstyleId ? (
                          <>
                            Đã chọn: <strong>{selectedStyle?.name}</strong>
                          </>
                        ) : (
                          <span>Chưa chọn kiểu tóc</span>
                        )}
                      </div>
                      <div className={styles.hairstyleFooterBtns}>
                        {booking.hairstyleId && (
                          <button
                            type="button"
                            className={styles.hairstyleClearBtn}
                            onClick={() =>
                              setBooking((prev) => ({
                                ...prev,
                                hairstyleId: null,
                              }))
                            }
                          >
                            Bỏ chọn
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.hairstyleConfirmBtn}
                          onClick={() => setShowHairstylePanel(false)}
                        >
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Silent mode ── */}
            <label
              className={`${styles.silentLabel} ${booking.silentMode ? styles.silentLabelActive : ""}`}
              htmlFor="silentMode"
            >
              <span className={styles.silentCheckbox}>
                {booking.silentMode && <span className={styles.silentTick}>✓</span>}
              </span>
              <span className={styles.silentLabelText}>Yêu cầu thợ giữ im lặng trong suốt quá trình làm dịch vụ</span>
              <input
                type="checkbox"
                id="silentMode"
                className={styles.silentHiddenInput}
                checked={booking.silentMode}
                onChange={(e) => setBooking((p) => ({ ...p, silentMode: e.target.checked }))}
              />
            </label>

            {/* ── Summary ── */}
            <div className={styles.summary}>
              <p>
                <span>Tạm tính</span>
                <span>{totalPrice.toLocaleString()}đ</span>
              </p>
              <p>
                <span>Giảm giá</span>
                <span>−{discountAmt.toLocaleString()}đ</span>
              </p>
              <p className={styles.summaryTotal}>
                <span>Thành tiền</span>
                <b>{finalPrice.toLocaleString()}đ</b>
              </p>

              {voucherWarning && <p className={styles.voucherWarning}>⚠ {voucherWarning}</p>}

              {booking.voucher &&
                !voucherWarning &&
                (() => {
                  const vd = booking.voucher.voucher || booking.voucher;
                  const isFixed = vd.discount_amount && Number(vd.discount_amount) > 0;
                  return (
                    <div className={styles.appliedVoucher}>
                      <p>
                        <strong>Voucher:</strong> {vd.name}
                      </p>
                      <p>
                        {isFixed ? `Giảm cố định ${formatMoney(vd.discount_amount)}` : `Giảm ${vd.discount_percent}%`}
                        {vd.max_discount_amount && !isFixed ? ` · Tối đa ${formatMoney(vd.max_discount_amount)}` : ""}
                      </p>
                    </div>
                  );
                })()}

              <button type="button" className={styles.voucherOpenBtn} onClick={() => setShowVoucherList(true)}>
                {booking.voucher ? "Đổi voucher khác" : "Áp dụng mã giảm"}
              </button>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading || isCheckingCalendar}>
              {isLoading ? "Đang xử lý..." : isCheckingCalendar ? "Đang kiểm tra..." : "Xác nhận đặt lịch"}
            </button>
          </form>
        </div>

        <img src="/keo.png" alt="Left Scissors" className={styles.scissorsLeft} />
        <img src="/keo.png" alt="Right Scissors" className={styles.scissorsRight} />

        {showVoucherList && (
          <VoucherPopup
            onClose={() => setShowVoucherList(false)}
            onSelect={handleVoucherSelect}
            defaultVoucher={booking.voucher}
            invoiceAmount={totalPrice}
          />
        )}
      </div>

      {isLoading && (
        <div className={styles.overlay}>
          <div className={styles.loader} />
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

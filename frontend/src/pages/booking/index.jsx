import { useState, useEffect, useCallback, useRef } from "react";
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
    voucher: null,
    idCustomerVoucher: null,
    silentMode: false,
    hairstyleId: null,
  });
const [hairstylesData, setHairstylesData] = useState([]);
  const { accessToken } = useAuth();
  const [isCheckingCalendar, setIsCheckingCalendar] = useState(false);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [showHairstylePanel, setShowHairstylePanel] = useState(false);
  const hairstylePanelRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [times, setTimes] = useState([]);
  const [bookedTimesByDate, setBookedTimesByDate] = useState({});
  const [unavailableDates, setUnavailableDates] = useState([]);

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

  // ─── Close hairstyle panel on outside click ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (hairstylePanelRef.current && !hairstylePanelRef.current.contains(e.target)) {
        setShowHairstylePanel(false);
      }
    };
    if (showHairstylePanel) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showHairstylePanel]);

  // ─── Build description ────────────────────────────────────────────────────
const buildDescription = (b) => {
    const parts = [];
    if (b.services.length) parts.push(b.services.map((s) => s.name).join(", "));
    
    if (b.hairstyleId) {
      // Tìm kiểu tóc trong mảng hairstylesData từ Backend bằng idHairstyle
      const hs = hairstylesData.find((h) => h.idHairstyle === b.hairstyleId);
      if (hs) parts.push(`Kiểu tóc: ${hs.name}`);
    }
    
    if (b.silentMode) parts.push("Khách yêu cầu giữ im lặng khi đang làm dịch vụ");
    return parts.join(" | ");
  };

  // ─── Branches ────────────────────────────────────────────────────────────
  const fetchBranches = useCallback(async (lat, lng) => {
    try {
      const params = lat && lng ? `?lat=${lat}&lng=${lng}` : "";
      const res = await fetch(`${API_BASE_URL}/bookings/branches${params}`);
      const data = await res.json();
      setBranches(data || []);
    } catch (err) { console.error("Error fetch branches:", err); }
  }, [API_BASE_URL]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị.");
      fetchBranches(); return;
    }
    setLocationLoading(true); setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setHasLocation(true); setLocationLoading(false); fetchBranches(lat, lng);
      },
      () => {
        setLocationError("Không thể lấy vị trí. Vui lòng cho phép truy cập.");
        setLocationLoading(false); fetchBranches();
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
          // Duyệt qua các danh mục để lấy toàn bộ danh sách kiểu tóc ra ngoài
          res.forEach((cat) => {
            if (cat.hairstyles && cat.hairstyles.length > 0) {
              cat.hairstyles.forEach((hair) => {
                allHairstyles.push(hair); // Mỗi hair chứa: idHairstyle, name, shortDescription, coverImage
              });
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
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]calendar=linked/, "").replace(/^&/, "?");
      window.history.replaceState({}, "", newUrl);
      const savedBooking = sessionStorage.getItem("pendingBooking");
      if (savedBooking) {
        const bookingData = JSON.parse(savedBooking);
        setBooking(bookingData);
        sessionStorage.removeItem("pendingBooking");
        showToast({ text: "Đã liên kết Google Calendar, đang tiến hành đặt lịch...", type: "info" });
        handleSubmitWithCalendarSync(true, bookingData);
      } else {
        showToast({ text: "Liên kết Google Calendar thành công!", type: "success" });
      }
    } else if (calendarStatus === "error") {
      const msg = urlParams.get("message") || "Liên kết thất bại, vui lòng thử lại";
      showToast({ text: decodeURIComponent(msg), type: "error" });
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]calendar=error[^&]*/, "").replace(/^&/, "?");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => { requestLocation(); }, []);

  const applyBranchSelection = useCallback(async (branchId) => {
    const selectedBranch = branches.find((b) => b.idBranch === branchId);
    setBooking((prev) => ({ ...prev, branchId, branch: selectedBranch?.name || "", barber: "", barberId: null, services: [], time: "", date: "" }));
    if (!branchId) { setBarbers([]); setServices([]); setTimes([]); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/branches/${branchId}`);
      const data = await res.json();
      setBarbers(data.barbers || []); setServices(data.services || []);
      if (data.openTime && data.closeTime && data.slotDuration) {
        const start = new Date(`2000-01-01T${data.openTime}`);
        const end   = new Date(`2000-01-01T${data.closeTime}`);
        const slot  = Number(data.slotDuration) || 60;
        const slots = [];
        for (let t = new Date(start); t < end; t = new Date(t.getTime() + slot * 60000))
          slots.push(t.toTimeString().slice(0, 5));
        setTimes(slots);
      } else { setTimes([]); }
    } catch (err) { console.error(err); setBarbers([]); setServices([]); setTimes([]); }
  }, [branches, API_BASE_URL]);

  const handleSubmitWithCalendarSync = async (syncToCalendar, bookingDataOverride = null) => {
    const finalBooking = bookingDataOverride || booking;
    if (!finalBooking.branchId || !finalBooking.barberId || !finalBooking.date || !finalBooking.time || !finalBooking.services.length) {
      showToast({ text: "Vui lòng điền đầy đủ thông tin!", type: "error" }); return false;
    }
    setIsLoading(true);
    const totalPrice    = finalBooking.services.reduce((sum, s) => sum + Number(s.price), 0);
    const discountAmt   = (totalPrice * finalBooking.discount) / 100;
    const finalPrice    = totalPrice - discountAmt;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          idBranch: finalBooking.branchId, idBarber: finalBooking.barberId,
          bookingDate: finalBooking.date, bookingTime: finalBooking.time,
          services: finalBooking.services.map((s) => ({ idService: s.idService, price: s.price, quantity: 1 })),
          description: buildDescription(finalBooking),
          idCustomerVoucher: finalBooking.idCustomerVoucher || null,
          syncToCalendar,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Lỗi khi tạo booking"); }
      showToast({ text: `Đặt lịch thành công! Thành tiền: ${finalPrice.toLocaleString()}đ`, type: "success" });
      setTimeout(() => window.location.reload(), 2500);
      return true;
    } catch (err) {
      showToast({ text: err.message || "Không thể kết nối server!", type: "error" }); return false;
    } finally { setIsLoading(false); }
  };

  const handleBranchChange = (e) => applyBranchSelection(Number(e.target.value) || null);
  const handleBranchCardClick = (branchId) => applyBranchSelection(branchId);

  const handleBarberChange = async (e) => {
    const barberId = Number(e.target.value) || null;
    const barber   = barbers.find((b) => Number(b.idBarber) === barberId);
    setBooking({ ...booking, barberId, barber: barber?.user?.fullName || "" });
    if (!barberId || !booking.branchId || !booking.date) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/bookings/barbers/${barberId}`);
      const data = await res.json();
      const grouped = {};
      data.bookedSlots?.forEach((time) => {
        if (!grouped[booking.date]) grouped[booking.date] = [];
        grouped[booking.date].push(time);
      });
      setBookedTimesByDate(grouped);
      const unava = [];
      data.unavailabilities?.forEach((u) => {
        for (let d = new Date(u.startDate); d <= new Date(u.endDate); d.setDate(d.getDate() + 1))
          unava.push(d.toISOString().split("T")[0]);
      });
      setUnavailableDates(unava);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (unavailableDates.includes(booking.date)) setBooking((prev) => ({ ...prev, date: "" }));
  }, [unavailableDates]);

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setBooking((prev) => ({ ...prev, date }));
    if (!booking.barberId || !booking.branchId) return;
    try {
      const data = await fetchBookedSlots(booking.barberId, booking.branchId, date);
      setBookedTimesByDate((prev) => ({ ...prev, [date]: data.bookedSlots || [] }));
      const unava = [];
      data.unavailabilities?.forEach((u) => {
        for (let d = new Date(u.startDate); d <= new Date(u.endDate); d.setDate(d.getDate() + 1))
          unava.push(d.toISOString().split("T")[0]);
      });
      setUnavailableDates(unava);
    } catch (err) { console.error(err); }
  };

  const handleTimeSelect = (time) => {
    const booked = booking.date ? bookedTimesByDate[booking.date] || [] : [];
    if (!booked.includes(time)) setBooking({ ...booking, time });
  };

  const handleServiceAdd = (e) => {
    const selectedId = Number(e.target.value) || null;
    const service    = services.find((s) => Number(s.idService) === selectedId);
    if (service && !booking.services.find((s) => Number(s.idService) === Number(service.idService)))
      setBooking({ ...booking, services: [...booking.services, service] });
  };

  const handleRemoveService = (idService) =>
    setBooking({ ...booking, services: booking.services.filter((s) => Number(s.idService) !== Number(idService)) });

  const handleVoucherSelect = (voucher) => {
    if (!voucher) { setBooking({ ...booking, discount: 0, voucher: null, idCustomerVoucher: null }); setShowVoucherList(false); return; }
    setBooking({ ...booking, discount: voucher.discount, voucher, idCustomerVoucher: voucher.idCustomerVoucher || null });
    setShowVoucherList(false);
  };

  const handleHairstyleSelect = (id) => {
    setBooking((prev) => ({ ...prev, hairstyleId: prev.hairstyleId === id ? null : id }));
    setShowHairstylePanel(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking.branchId)   return showToast({ text: "Vui lòng chọn cơ sở!", type: "error" });
    if (!booking.barberId)   return showToast({ text: "Vui lòng chọn kỹ thuật viên!", type: "error" });
    if (!booking.date)       return showToast({ text: "Vui lòng chọn ngày!", type: "error" });
    if (!booking.time)       return showToast({ text: "Vui lòng chọn thời gian!", type: "error" });
    if (!booking.services.length) return showToast({ text: "Vui lòng chọn ít nhất một dịch vụ!", type: "error" });
    if (!accessToken) { showToast({ text: "Vui lòng đăng nhập để đặt lịch!", type: "error" }); return; }

    setIsCheckingCalendar(true);
    try {
      const calendarStatus = await getCalendarLinkStatus(accessToken);
      if (!calendarStatus.linked) {
        setConfirmModal({
          isOpen: true,
          title: "Liên kết Google Calendar",
          message: "Bạn chưa liên kết Google Calendar. Bạn có muốn liên kết để đồng bộ lịch hẹn vào Google Calendar không?",
          confirmText: "Liên kết", cancelText: "Bỏ qua", confirmType: "primary",
          onConfirm: () => {
            closeConfirmModal();
            sessionStorage.setItem("pendingBooking", JSON.stringify(booking));
            const returnUrl = window.location.pathname + window.location.search;
            getGoogleAuthUrl(accessToken, returnUrl).then((url) => { window.location.href = url; });
          },
          onCancel: () => { closeConfirmModal(); handleSubmitWithCalendarSync(false); },
        });
      } else { await handleSubmitWithCalendarSync(true); }
    } catch (error) {
      showToast({ text: "Có lỗi xảy ra, vui lòng thử lại sau", type: "error" });
    } finally { setIsCheckingCalendar(false); }
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const totalPrice    = booking.services.reduce((sum, s) => sum + Number(s.price), 0);
  const discountAmt   = (totalPrice * booking.discount) / 100;
  const finalPrice    = totalPrice - discountAmt;
  const bookedTimes   = booking.date ? bookedTimesByDate[booking.date] || [] : [];
const selectedStyle = hairstylesData.find((h) => h.idHairstyle === booking.hairstyleId);

  const getBranchStatus = (b) => {
    const now = new Date();
    if (b.suspendDate && !b.resumeDate) {
      const sd = new Date(b.suspendDate);
      if (sd > now) return { type: "warn", label: `Ngưng ${sd.toLocaleDateString("vi-VN")}` };
    }
    if (b.resumeDate) {
      const rd = new Date(b.resumeDate);
      if (rd > now) return { type: "pause", label: `Mở ${rd.toLocaleDateString("vi-VN")}` };
    }
    return null;
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
                {[1, 2, 3].map((i) => <div key={i} className={`${styles.branchCard} ${styles.branchCardSkeleton}`} />)}
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
                      className={`${styles.branchCard} ${isSelected ? styles.branchCardSelected : ""} ${isNearest ? styles.branchCardNearest : ""}`}
                      onClick={() => handleBranchCardClick(b.idBranch)}
                      role="button" tabIndex={0}
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
                        {status && <span className={status.type === "warn" ? styles.chipWarn : styles.chipPause}>{status.label}</span>}
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
                    const resume  = b.resumeDate  ? new Date(b.resumeDate).toLocaleDateString("vi-VN")  : null;
                    let label = b.name;
                    if (suspend && !resume) label += ` — (ngưng từ ${suspend})`;
                    if (resume && new Date(b.resumeDate) > new Date()) label += ` — (mở từ ${resume})`;
                    return <option key={b.idBranch} value={b.idBranch}>{label}</option>;
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
                  {barbers.map((barber) => (
                    <option key={barber.idBarber} value={barber.idBarber}>{barber.user?.fullName}</option>
                  ))}
                </select>
                <span className={styles.selectArrow}>▾</span>
              </div>
            </div>

            {/* ── Ngày ── */}
            <div className={styles.formGroup}>
              <label>Ngày hẹn</label>
              <div className={styles.dateList}>
                {[...Array(8)].map((_, i) => {
                  const d = new Date(); d.setDate(today.getDate() + i);
                  const value       = d.toISOString().split("T")[0];
                  const dayLabel    = i === 0 ? "Hôm nay" : d.toLocaleDateString("vi-VN", { weekday: "short" });
                  const dateNum     = d.toLocaleDateString("vi-VN", { day: "2-digit" });
                  const monthNum    = d.toLocaleDateString("vi-VN", { month: "2-digit" });
                  const isUnavail   = unavailableDates.includes(value);
                  const isSelected  = booking.date === value;
                  return (
                    <div
                      key={i}
                      className={`${styles.dateCard} ${isSelected ? styles.dateCardSelected : ""} ${isUnavail ? styles.dateCardDisabled : ""}`}
                      onClick={() => { if (!isUnavail) handleDateChange({ target: { value } }); }}
                    >
                      <span className={styles.dateDay}>{dayLabel}</span>
                      <span className={styles.dateNumber}>{dateNum}</span>
                      <span className={styles.dateMonth}>Tháng {monthNum}</span>
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
                    const slot = new Date(today); slot.setHours(hh, mm, 0, 0);
                    if (slot < today) isPast = true;
                  }
                  const isBooked = bookedTimes.includes(time);
                  return (
                    <button
                      key={i} type="button"
                      className={`${styles.timeSlot} ${isBooked || isPast ? styles.booked : ""} ${booking.time === time ? styles.selected : ""}`}
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
                      {s.status === "Inactive" ? `${s.name} - Đang cập nhật...` : `${s.name} - ${Number(s.price).toLocaleString()}đ`}
                    </option>
                  ))}
                </select>
                <span className={styles.selectArrow}>▾</span>
              </div>
              <ul className={styles.serviceList}>
                {booking.services.map((s) => (
                  <li key={s.idService}>
                    <span>{s.name} — {Number(s.price).toLocaleString()}đ</span>
                    <button type="button" onClick={() => handleRemoveService(s.idService)}>✕</button>
                  </li>
                ))}
              </ul>
            </div>
     {/* ====================== CHỌN KIỂU TÓC (Có Hover Side Image) ====================== */}
<div className={styles.hairstyleSection}>
  <button
    type="button"
    className={styles.hairstyleOpenBtn}
    onClick={() => setShowHairstylePanel(true)}
  >
    {selectedStyle ? `Kiểu tóc: ${selectedStyle.name}` : "Chọn kiểu tóc phù hợp với bạn"}
    <span className={styles.arrow}>›</span>
  </button>

  {/* Modal chọn kiểu tóc */}
  {showHairstylePanel && (
    <div className={styles.hairstyleModalOverlay}>
      <div className={styles.hairstyleModal}>
        <div className={styles.modalHeader}>
          <h3>Chọn kiểu tóc</h3>
          <button 
            type="button" 
            className={styles.closeModalBtn}
            onClick={() => setShowHairstylePanel(false)}
          >
            ✕
          </button>
        </div>

        <p className={styles.modalHint}>
          Di chuột vào ảnh để xem góc nghiêng • Chọn một phong cách bạn thích
        </p>

        <div className={styles.hairstyleGrid}>
          {hairstylesData.map((hs) => {
            const isSelected = booking.hairstyleId === hs.idHairstyle;
            return (
              <div
                key={hs.idHairstyle}
                className={`${styles.hairstyleCard} ${isSelected ? styles.hairstyleCardSelected : ""}`}
                onClick={() => handleHairstyleSelect(hs.idHairstyle)}
              >
                <div className={styles.hairstyleImageContainer}>
                  {/* Ảnh chính */}
                  <img
                    src={hs.coverImage}
                    alt={hs.name}
                    className={styles.hairstyleImage}
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/300x200/2c2c2c/ffffff?text=${encodeURIComponent(hs.name)}`;
                    }}
                  />

                  {/* Ảnh side - hiện khi hover */}
                  {hs.sideImage && (
                    <img
                      src={hs.sideImage}
                      alt={`${hs.name} - side view`}
                      className={`${styles.hairstyleSideImage} ${styles.hairstyleImage}`}
                      onError={(e) => e.target.style.display = "none"}
                    />
                  )}

                  {isSelected && <div className={styles.selectedBadge}>✓ Đã chọn</div>}
                </div>

                <div className={styles.hairstyleCardInfo}>
                  <h4>{hs.name}</h4>
                  <p>{hs.shortDescription || "Không có mô tả"}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={() => setShowHairstylePanel(false)}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )}
</div>

            {/* ════════════════════════════════════════
                SILENT MODE — luxury checkbox
            ════════════════════════════════════════ */}
            <label className={`${styles.silentLabel} ${booking.silentMode ? styles.silentLabelActive : ""}`} htmlFor="silentMode">
              <span className={styles.silentCheckbox}>
                {booking.silentMode && <span className={styles.silentTick}>✓</span>}
              </span>
              <span className={styles.silentLabelText}>
                Yêu cầu thợ giữ im lặng trong suốt quá trình làm dịch vụ
              </span>
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
              <p><span>Tạm tính</span><span>{totalPrice.toLocaleString()}đ</span></p>
              <p><span>Giảm giá</span><span>−{discountAmt.toLocaleString()}đ</span></p>
              <p className={styles.summaryTotal}>
                <span>Thành tiền</span>
                <b>{finalPrice.toLocaleString()}đ</b>
              </p>
              {booking.voucher && (
                <div className={styles.appliedVoucher}>
                  <p><strong>Voucher:</strong> {booking.voucher.title}</p>
                  <p>Giảm {booking.voucher.discount}% · Cần {booking.voucher.pointCost} điểm</p>
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
              {isLoading ? "Đang xử lý..." : isCheckingCalendar ? "Đang kiểm tra..." : "Xác nhận đặt lịch"}
            </button>
          </form>
        </div>

        <img src="/keo.png" alt="Left Scissors"  className={styles.scissorsLeft} />
        <img src="/keo.png" alt="Right Scissors" className={styles.scissorsRight} />

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
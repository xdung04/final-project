import { useState, useEffect, useMemo } from "react";
import DefaultLayout from "../../layouts/DefaultLayout";
import styles from "./Booking.module.scss";
import VoucherPopup from "../../components/VoucherPopup";
import { fetchBookedSlots } from "~/services/bookingService";
import { useToast } from "~/context/ToastContext";
import { useAuth } from "~/context/AuthContext";

function BookingPage() {
  const { user, isLogin } = useAuth();
  const { showToast } = useToast();
  
  const [booking, setBooking] = useState({
    branchId: null,
    branchName: "",
    barberId: null,
    barberName: "",
    date: "",
    time: "",
    services: [],
    discount: 0,
    voucher: null,
    idCustomerVoucher: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [branches, setBranches] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [times, setTimes] = useState([]);
  const [bookedTimesByDate, setBookedTimesByDate] = useState({});
  const [unavailableDates, setUnavailableDates] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const today = useMemo(() => new Date(), []);

  // 1. Fetch danh sách chi nhánh
  useEffect(() => {
    fetch(`${API_BASE_URL}/bookings/branches`)
      .then((res) => res.json())
      .then((data) => setBranches(data || []))
      .catch((err) => console.error("Lỗi fetch chi nhánh:", err));
  }, [API_BASE_URL]);

  // 2. Xử lý đổi chi nhánh
  const handleBranchChange = async (e) => {
    const branchId = Number(e.target.value) || null;
    const selectedBranch = branches.find((b) => b.idBranch === branchId);

    setBooking((prev) => ({
      ...prev,
      branchId,
      branchName: selectedBranch?.name || "",
      barberId: null,
      barberName: "",
      services: [],
      time: "",
      date: "",
    }));

    if (!branchId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/branches/${branchId}`);
      const data = await res.json();
      setBarbers(data.barbers || []);
      setServices(data.services || []);

      // Tính toán khung giờ khả dụng (Slot)
      if (data.openTime && data.closeTime) {
        const slots = [];
        let start = new Date(`2000-01-01T${data.openTime}`);
        const end = new Date(`2000-01-01T${data.closeTime}`);
        const step = Number(data.slotDuration) || 60;

        while (start < end) {
          slots.push(start.toTimeString().slice(0, 5));
          start = new Date(start.getTime() + step * 60000);
        }
        setTimes(slots);
      }
    } catch (err) {
      console.error("Lỗi fetch chi tiết chi nhánh:", err);
    }
  };

  // 3. Xử lý đổi Barber hoặc Ngày để fetch lịch đã đặt
  const fetchAvailability = async (barberId, branchId, date) => {
    if (!barberId || !branchId || !date) return;
    try {
      const data = await fetchBookedSlots(barberId, branchId, date);
      setBookedTimesByDate((prev) => ({ ...prev, [date]: data.bookedSlots || [] }));
      
      const unava = data.unavailabilities?.flatMap((u) => {
        const dates = [];
        let d = new Date(u.startDate);
        const end = new Date(u.endDate);
        while (d <= end) {
          dates.push(d.toISOString().split("T")[0]);
          d.setDate(d.getDate() + 1);
        }
        return dates;
      }) || [];
      setUnavailableDates(unava);
    } catch (err) {
      console.error("Lỗi fetch lịch trống:", err);
    }
  };

  const handleBarberChange = (e) => {
    const id = Number(e.target.value);
    const barber = barbers.find((b) => b.idBarber === id);
    setBooking((prev) => ({ ...prev, barberId: id, barberName: barber?.user?.fullName || "" }));
    fetchAvailability(id, booking.branchId, booking.date);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setBooking((prev) => ({ ...prev, date, time: "" }));
    fetchAvailability(booking.barberId, booking.branchId, date);
  };

  // 4. Quản lý dịch vụ & Voucher
  const toggleService = (id) => {
    const service = services.find((s) => s.idService === id);
    if (!service) return;

    setBooking((prev) => {
      const isExist = prev.services.find((s) => s.idService === id);
      return {
        ...prev,
        services: isExist 
          ? prev.services.filter((s) => s.idService !== id)
          : [...prev.services, service]
      };
    });
  };

  const handleVoucherSelect = (v) => {
    setBooking((p) => ({
      ...p,
      discount: v?.discount || 0,
      voucher: v || null,
      idCustomerVoucher: v?.idCustomerVoucher || null,
    }));
    setShowVoucherList(false);
  };

  // 5. Tính toán giá tiền
  const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.price), 0);
  const discountAmount = (totalPrice * booking.discount) / 100;
  const finalPrice = totalPrice - discountAmount;

  // 6. Submit Đặt lịch
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔥 Chặn nhân viên đặt lịch tại đây
    if (isLogin && user?.role !== "customer") {
      return showToast({ text: "Nhân viên vui lòng sử dụng hệ thống nội bộ để đặt lịch!", type: "error" });
    }

    if (!booking.branchId || !booking.barberId || !booking.date || !booking.time || !booking.services.length) {
      return showToast({ text: "Vui lòng hoàn thiện đầy đủ thông tin!", type: "error" });
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          idBranch: booking.branchId,
          idBarber: booking.barberId,
          bookingDate: booking.date,
          bookingTime: booking.time,
          idCustomerVoucher: booking.idCustomerVoucher,
          services: booking.services.map((s) => ({ idService: s.idService, price: s.price, quantity: 1 })),
          description: booking.services.map((s) => s.name).join(", "),
        }),
      });

      if (!res.ok) throw new Error((await res.json()).message || "Đặt lịch thất bại");

      showToast({ text: "Đặt lịch thành công!", type: "success" });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      showToast({ text: err.message, type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className={styles.bookingWrapper}>
        <div className={styles.logoBarber}><img src="/rau.png" alt="logo" /></div>

        <div className={styles.bookingContainer}>
          <h2>Đặt lịch dịch vụ</h2>
          <form onSubmit={handleSubmit}>
            {/* Chi nhánh */}
            <div className={styles.formGroup}>
              <label>Cơ sở:</label>
              <select value={booking.branchId || ""} onChange={handleBranchChange}>
                <option value="">-- Chọn chi nhánh --</option>
                {branches.map((b) => <option key={b.idBranch} value={b.idBranch}>{b.name}</option>)}
              </select>
            </div>

            {/* Barber */}
            <div className={styles.formGroup}>
              <label>Thợ cắt:</label>
              <select disabled={!barbers.length} value={booking.barberId || ""} onChange={handleBarberChange}>
                <option value="">-- Chọn thợ --</option>
                {barbers.map((b) => <option key={b.idBarber} value={b.idBarber}>{b.user?.fullName}</option>)}
              </select>
            </div>

            {/* Ngày */}
            <div className={styles.formGroup}>
              <label>Ngày:</label>
              <select value={booking.date} onChange={handleDateChange}>
                <option value="">-- Chọn ngày --</option>
                {[...Array(7)].map((_, i) => {
                  const d = new Date();
                  d.setDate(today.getDate() + i);
                  const val = d.toISOString().split("T")[0];
                  return (
                    <option key={val} value={val} disabled={unavailableDates.includes(val)}>
                      {d.toLocaleDateString("vi-VN", { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Thời gian */}
            <div className={styles.timeGrid}>
              {times.map((t) => {
                const isBooked = bookedTimesByDate[booking.date]?.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isBooked}
                    className={`${styles.timeSlot} ${booking.time === t ? styles.selected : ""} ${isBooked ? styles.booked : ""}`}
                    onClick={() => setBooking({ ...booking, time: t })}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Dịch vụ */}
            <div className={styles.formGroup}>
              <label>Dịch vụ:</label>
              <div className={styles.servicePicker}>
                {services.map((s) => (
                  <label key={s.idService} className={styles.serviceItem}>
                    <input 
                      type="checkbox" 
                      checked={!!booking.services.find(i => i.idService === s.idService)}
                      onChange={() => toggleService(s.idService)} 
                    />
                    <span>{s.name} ({Number(s.price).toLocaleString()}đ)</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tổng kết */}
            <div className={styles.summary}>
              <div className={styles.priceRow}>
                <span>Tạm tính:</span> <span>{totalPrice.toLocaleString()}đ</span>
              </div>
              {booking.discount > 0 && (
                <div className={styles.priceRow}>
                  <span>Giảm giá:</span> <span className={styles.discount}>-{discountAmount.toLocaleString()}đ</span>
                </div>
              )}
              <div className={styles.priceRow}>
                <strong>Thành tiền:</strong> <strong>{finalPrice.toLocaleString()}đ</strong>
              </div>
              <button type="button" className={styles.voucherBtn} onClick={() => setShowVoucherList(true)}>
                {booking.voucher ? `Đã chọn: ${booking.voucher.title}` : "Chọn mã giảm giá"}
              </button>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={isLoading || (isLogin && user?.role !== 'customer')}
            >
              {isLogin && user?.role !== 'customer' ? "Chế độ nhân viên" : (isLoading ? "Đang xử lý..." : "Xác nhận đặt lịch")}
            </button>
          </form>
        </div>
      </div>

      {showVoucherList && (
        <VoucherPopup 
          onClose={() => setShowVoucherList(false)} 
          onSelect={handleVoucherSelect} 
          defaultVoucher={booking.voucher} 
        />
      )}

      {isLoading && <div className={styles.overlay}><div className={styles.loader}></div></div>}
    </DefaultLayout>
  );
}

export default BookingPage;
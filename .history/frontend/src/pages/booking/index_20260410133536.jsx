import { useState, useEffect } from "react";
import DefaultLayout from "../../layouts/DefaultLayout";
import styles from "./Booking.module.scss";
import VoucherPopup from "../../components/VoucherPopup";
import { fetchBookedSlots } from "~/services/bookingService";
import { useToast } from "~/context/ToastContext";


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
  const { showToast } = useToast();
const [isLoading, setIsLoading] = useState(false);

  const [showVoucherList, setShowVoucherList] = useState(false);
  const [branches, setBranches] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [times, setTimes] = useState([]);
  const [bookedTimesByDate, setBookedTimesByDate] = useState({});
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [branchDisplay, setBranchDisplay] = useState("-- Chọn cơ sở --");

  const today = new Date();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  // ================= CALL API =================
  useEffect(() => {
    fetch(`${API_BASE_URL}/bookings/branches`)
      .then((res) => res.json())
      .then((data) => setBranches(data || []))
      .catch((err) => console.error("Error fetch branches:", err));
  }, []);

  const handleBranchChange = async (e) => {
  const branchId = Number(e.target.value) || null;
    // CẦN ĐẶT selected Ở ĐÂY — trước khi dùng !!!
  const selectedBranch = branches.find(
    (b) => b.idBranch === branchId
  );

  // Cập nhật label hiển thị
  setBranchDisplay(
    selectedBranch ? selectedBranch.name : "-- Chọn cơ sở --"
  );

  setBooking({
    ...booking,
    branchId,
    branch: selectedBranch ? selectedBranch.name : "", // CHỈ LƯU TÊN
    barber: "",
    barberId: null,
    services: [],
    time: "",
    date: "",
  });

  if (!branchId) {
    setBarbers([]);
    setServices([]);
    setTimes([]);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/branches/${branchId}`);
    const data = await res.json();

    setBooking((prev) => ({ ...prev, branch: data.name || "" }));
    setBarbers(data.barbers || []);
    setServices(data.services || []);

    if (data.openTime && data.closeTime && data.slotDuration) {
      const start = new Date(`2000-01-01T${data.openTime}`);
      const end = new Date(`2000-01-01T${data.closeTime}`);
      const slot = Number(data.slotDuration) || 60;

      const slots = [];
      for (let t = new Date(start); t < end; t = new Date(t.getTime() + slot * 60000)) {
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
};


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
      const data = await fetchBookedSlots(booking.barberId, booking.branchId, date);

      const grouped = {};
      grouped[date] = data.bookedSlots || [];
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
    const bookedTimes = booking.date ? bookedTimesByDate[booking.date] || [] : [];
    if (!bookedTimes.includes(time)) setBooking({ ...booking, time });
  };

  const handleServiceAdd = (e) => {
    const selectedId = Number(e.target.value) || null;
    const service = services.find((s) => Number(s.idService) === selectedId);
    if (service && !booking.services.find((s) => Number(s.idService) === Number(service.idService))) {
      setBooking({ ...booking, services: [...booking.services, service] });
    }
  };

  const handleRemoveService = (idService) =>
    setBooking({ ...booking, services: booking.services.filter((s) => Number(s.idService) !== Number(idService)) });

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

    // Kiểm tra thông tin bắt buộc
   if (!booking.branchId)
  return showToast({ text: "Vui lòng chọn cơ sở!", type: "error" });

if (!booking.barberId)
  return showToast({ text: "Vui lòng chọn kỹ thuật viên!", type: "error" });

if (!booking.date)
  return showToast({ text: "Vui lòng chọn ngày!", type: "error" });

if (!booking.time)
  return showToast({ text: "Vui lòng chọn thời gian!", type: "error" });

if (!booking.services.length)
  return showToast({ text: "Vui lòng chọn ít nhất một dịch vụ!", type: "error" });

  setIsLoading(true); 
    const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.price), 0);
    const discountAmount = (totalPrice * booking.discount) / 100;
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
          idBranch: booking.branchId,
          idBarber: booking.barberId,
          bookingDate: booking.date,
          bookingTime: booking.time,
          services: booking.services.map((s) => ({
            idService: s.idService,
            price: s.price,
            quantity: 1,
          })),
          description: booking.services.map((s) => s.name).join(", "),
          idCustomerVoucher: booking.idCustomerVoucher || null,
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


    setTimeout(() => {
  window.location.reload();
}, 2500); // 2.5 giây
    } catch (err) {
  console.error(err);
  const msg = err.message || "Không thể kết nối server!";
  showToast({ text: msg, type: "error" });
}
finally {
    setIsLoading(false); 
  }

  };

  const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.price), 0);
  const discountAmount = (totalPrice * booking.discount) / 100;
  const finalPrice = totalPrice - discountAmount;
  const bookedTimes = booking.date ? bookedTimesByDate[booking.date] || [] : [];

  return (
    <DefaultLayout>
      <div className={styles.bookingWrapper}>
        <div className={styles.grainOverlay}></div>
        <div className={styles.logoBarber}>
          <img src="/rau.png" alt="Barber Logo" />
        </div>

        <div className={styles.bookingContainer}>
          <h2>Đặt lịch Barber</h2>
          <form onSubmit={handleSubmit}>
            {/* Cơ sở */}
            <div className={styles.formGroup}>
              <label>Cơ sở:</label>
<select value={booking.branchId || ""} onChange={handleBranchChange}>
  
  {/* Đây là option hiển thị tên khi được chọn */}
  <option value="">
    {branchDisplay}
  </option>

  {branches.map((b) => {
    const suspend = b.suspendDate ? new Date(b.suspendDate).toLocaleDateString("vi-VN") : null;
    const resume = b.resumeDate ? new Date(b.resumeDate).toLocaleDateString("vi-VN") : null;

    let label = b.name;

    if (suspend && !resume) {
      label += ` — (sẽ ngưng hoạt động từ ${suspend})`;
    }
    if (resume && new Date(b.resumeDate) > new Date()) {
      label += ` — (sẽ hoạt động từ ${resume})`;
    }

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
              <select value={booking.barberId || ""} onChange={handleBarberChange} disabled={!barbers.length}>
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
              <label>Ngày:</label>
              <select value={booking.date} onChange={handleDateChange}>
                <option value="">-- Chọn ngày --</option>
                {[...Array(8)].map((_, i) => {
                  const d = new Date();
                  d.setDate(today.getDate() + i);
                  const value = d.toISOString().split("T")[0];
                  const label = d.toLocaleDateString("vi-VN", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  const isUnavailable = unavailableDates.includes(value);
                  return (
                    <option key={i} value={value} disabled={isUnavailable}>
                      {label} {isUnavailable ? "(Nghỉ)" : ""}
                    </option>
                  );
                })}
              </select>
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
                      className={`${styles.timeSlot} ${isBooked || isPast ? styles.booked : ""} ${
                        booking.time === time ? styles.selected : ""
                      }`}
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
        disabled={s.status === "Inactive"} // 🔥 disable nếu đang cập nhật
      >
        {s.name} {s.status === "Inactive" ? "- Đang cập nhật..." : `${s.name} - ${Number(s.price).toLocaleString()}đ`}
      </option>
    ))}
  </select>
  <ul className={styles.serviceList}>
    {booking.services.map((s) => (
      <li key={s.idService}>
        {s.name} - {Number(s.price).toLocaleString()}đ
        <button type="button" onClick={() => handleRemoveService(s.idService)}>
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
                    <strong>Voucher đang áp dụng:</strong> {booking.voucher.title}
                  </p>
                  <p>Giảm: {booking.voucher.discount}%</p>
                  <p>Điểm cần: {booking.voucher.pointCost}</p>
                </div>
              )}
              <button type="button" onClick={() => setShowVoucherList(true)}>
                Áp dụng mã giảm
              </button>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Xác nhận đặt lịch
            </button>
          </form>
        </div>

        <img src="/keo.png" alt="Left Scissors" className={styles.scissorsLeft} />
        <img src="/keo.png" alt="Right Scissors" className={styles.scissorsRight} />

       {showVoucherList && (
  <VoucherPopup
    onClose={() => setShowVoucherList(false)}
    onSelect={handleVoucherSelect}
    defaultVoucher={booking.voucher}   // 🔥 QUAN TRỌNG!
  />
)}

      </div>
      {isLoading && (
  <div className={styles.overlay}>
    <div className={styles.loader}></div>
  </div>
)}
    </DefaultLayout>
  );
}

export default BookingPage;

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./DirectBooking.module.scss";
import { fetchBookedSlots } from "~/services/bookingService";
import { useToast } from "~/context/ToastContext";
import { useAuth } from "~/context/AuthContext";
export default function DirectBooking({ onClose, onSuccess }) {
  const { showToast } = useToast();
const { user } = useAuth(); 
  const [phone, setPhone] = useState("");
  const [customerExists, setCustomerExists] = useState(false);
  const [customerId, setCustomerId] = useState(0);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });

  const [branches, setBranches] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [times, setTimes] = useState([]);

  const [bookedTimesByDate, setBookedTimesByDate] = useState({});
  const [barberLockDate, setBarberLockDate] = useState(null);
  const [dateWarning, setDateWarning] = useState("");



  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [form, setForm] = useState({
  name: "",
  branchId: "",
  barberId: "",
  date: todayStr,  // ← đổi từ "" thành todayStr
  time: "",
  services: [],
});

  // ===== LOAD CHI NHÁNH =====
  useEffect(() => {
    fetch(`${API_BASE_URL}/bookings/branches`)
      .then((res) => res.json())
      .then((data) => setBranches(data || []))
      .catch((err) => console.error("Error fetch branches:", err));
  }, []);
// ===== AUTO-SELECT CHI NHÁNH CỦA LỄ TÂN =====
useEffect(() => {
  if (!user?.idBranch) return;
  handleBranchChangeById(user.idBranch);
}, [user?.idBranch]);

// Hàm load branch theo id (tách ra để dùng được trong useEffect)
const handleBranchChangeById = async (branchId) => {
  branchId = Number(branchId);
  setForm((prev) => ({
    ...prev,
    branchId,
    barberId: "",
    date: todayStr,
    time: "",
    services: [],
  }));
  setBarbers([]);
  setServices([]);
  setTimes([]);
  setBookedTimesByDate({});
  setBarberLockDate(null);
  setDateWarning("");

  if (!branchId) return;

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/branches/${branchId}`);
    const data = await res.json();
    setServices(data.services || []);

    let slots = [];
    if (data.openTime && data.closeTime && data.slotDuration) {
      const start = new Date(`2000-01-01T${data.openTime}`);
      const end = new Date(`2000-01-01T${data.closeTime}`);
      const slot = Number(data.slotDuration) || 60;
      for (
        let t = new Date(start);
        t < end;
        t = new Date(t.getTime() + slot * 60000)
      ) {
        slots.push(t.toTimeString().slice(0, 5));
      }
    }
    setTimes(slots);

    // Sort thợ theo slot rảnh gần nhất
    const rawBarbers = data.barbers || [];
    const currentTimeStr = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

    const results = await Promise.allSettled(
      rawBarbers.map(async (barber) => {
        try {
          const slotData = await fetchBookedSlots(barber.idBarber, branchId, todayStr);
          const bookedTimes = slotData.bookedSlots || [];
          const nextFreeSlot = slots.find(
            (s) => s >= currentTimeStr && !bookedTimes.includes(s)
          );
          return { ...barber, _nextFreeSlot: nextFreeSlot || null };
        } catch {
          return { ...barber, _nextFreeSlot: null };
        }
      })
    );

    const enriched = results.map((r) =>
      r.status === "fulfilled" ? r.value : { ...r.reason, _nextFreeSlot: null }
    );

    enriched.sort((a, b) => {
      if (a._nextFreeSlot && b._nextFreeSlot)
        return a._nextFreeSlot.localeCompare(b._nextFreeSlot);
      if (a._nextFreeSlot) return -1;
      if (b._nextFreeSlot) return 1;
      return 0;
    });

    setBarbers(enriched);
  } catch (err) {
    console.error("Error fetch branch details:", err);
    showToast({ text: "Không thể tải thông tin chi nhánh!", type: "error" });
  }
};
  // ===== KIỂM TRA KHÁCH HÀNG =====
  const handleCheck = async () => {
    if (!phone.trim()) {
      showToast({ text: "Vui lòng nhập số điện thoại!", type: "error" });
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/booking-direct/find?phone=${phone}`);
      const data = await res.json();
      if (data.exists) {
        setCustomerExists(true);
        setForm((prev) => ({ ...prev, name: data.name }));
        setCustomerId(data.idCustomer || 0);
        showToast({ text: `Tìm thấy khách hàng: ${data.name}`, type: "success" });
      } else {
        setCustomerExists(false);
        setCustomerId(0);
        setForm((prev) => ({ ...prev, name: "" }));
        showToast({ text: "Không tìm thấy tài khoản này. Vui lòng tạo tài khoản mới.", type: "warning" });
      }
    } catch (err) {
      console.error("Lỗi khi kiểm tra khách hàng:", err);
      showToast({ text: "Không thể kiểm tra thông tin khách hàng!", type: "error" });
    } finally {
      setChecking(false);
    }
  };

  // ===== TẠO KHÁCH HÀNG MỚI =====
  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      showToast({ text: "Vui lòng nhập đủ họ tên và số điện thoại!", type: "error" });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/create-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newCustomer.name,
          phoneNumber: newCustomer.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast({ text: `Tạo khách hàng thất bại: ${data.message || "Lỗi server"}`, type: "error" });
        return;
      }
      showToast({ text: "Tạo khách hàng thành công!", type: "success" });
      setShowCreateCustomer(false);
      setNewCustomer({ name: "", phone: "" });
    } catch (err) {
      console.error("Network error:", err);
      showToast({ text: "Không thể kết nối server!", type: "error" });
    }
  };

  // ===== CHỌN CHI NHÁNH =====
const handleBranchChange = (e) => {
  handleBranchChangeById(e.target.value);
};

  // ===== CHỌN BARBER =====
  const handleBarberChange = (e) => {
    const barberId = Number(e.target.value);
    const barber = barbers.find((b) => Number(b.idBarber) === barberId);

    setForm((prev) => ({ ...prev, barberId, date: "", time: "" }));
    setBookedTimesByDate({});
    setBarberLockDate(null);
    setDateWarning("");

    if (!barberId) return;

    if (barber?.lockDate) {
      setBarberLockDate(barber.lockDate);
      showToast({
        text: `Thợ này sẽ nghỉ từ ngày ${new Date(barber.lockDate).toLocaleDateString("vi-VN")} — chỉ đặt được trước ngày đó.`,
        type: "warning",
      });
    }
  };

  // ===== CHỌN NGÀY =====
  const handleDateChange = async (e) => {
    const date = e.target.value;
    setDateWarning("");
    setForm((prev) => ({ ...prev, date, time: "" }));

    if (!form.barberId || !form.branchId) return;

    try {
      const data = await fetchBookedSlots(form.barberId, form.branchId, date);

      if (data.isUnavailable) {
        if (data.reason === "dayoff") {
          const msg = `Thợ đang nghỉ ngày này: ${data.dayOffReason}`;
          setDateWarning(`⚠ ${msg}`);
          showToast({ text: msg, type: "warning" });
        } else if (data.reason === "locked") {
          const msg = `Thợ không làm việc từ ngày ${new Date(data.lockDate).toLocaleDateString("vi-VN")} trở đi`;
          setDateWarning(`⚠ ${msg}`);
          showToast({ text: msg, type: "warning" });
        }
        setBookedTimesByDate((prev) => ({
          ...prev,
          [date]: data.bookedSlots || [],
        }));
        return;
      }

      if (data.lockDate && !barberLockDate) {
        setBarberLockDate(data.lockDate);
      }

      setBookedTimesByDate((prev) => ({
        ...prev,
        [date]: data.bookedSlots || [],
      }));
    } catch (err) {
      console.error("Lỗi lấy slot:", err);
      const msg = err.message || "Không thể lấy thông tin ngày này";
      setDateWarning(`⚠ ${msg}`);
      showToast({ text: msg, type: "error" });
    }
  };

  // Helper: kiểm tra ngày có bị block bởi lockDate không
  const isDateBlockedByLock = (dateValue) => {
    if (!barberLockDate) return false;
    const lockDay = new Date(barberLockDate);
    lockDay.setHours(0, 0, 0, 0);
    const checkDay = new Date(dateValue);
    checkDay.setHours(0, 0, 0, 0);
    return checkDay >= lockDay;
  };

  // ===== CHỌN GIỜ =====
  const handleTimeSelect = (time) => {
    const bookedTimes = form.date ? bookedTimesByDate[form.date] || [] : [];
    if (!bookedTimes.includes(time)) {
      setForm((prev) => ({ ...prev, time }));
    }
  };

  // ===== DỊCH VỤ =====
  const handleServiceAdd = (e) => {
    const selectedId = Number(e.target.value);
    const selected = services.find((s) => s.idService === selectedId);
    if (selected && !form.services.find((s) => s.idService === selected.idService)) {
      setForm((prev) => ({ ...prev, services: [...prev.services, selected] }));
    }
  };

  const handleRemoveService = (idService) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.idService !== idService),
    }));
  };

  // ===== GỬI BOOKING =====
  const handleSubmit = async () => {
    if (submitting) return;
    if (!customerExists) {
      showToast({ text: "Vui lòng kiểm tra hoặc tạo tài khoản khách hàng trước!", type: "error" });
      return;
    }
    if (!form.branchId) return showToast({ text: "Vui lòng chọn chi nhánh!", type: "error" });
    if (!form.barberId) return showToast({ text: "Vui lòng chọn thợ cắt!", type: "error" });
    if (!form.date) return showToast({ text: "Vui lòng chọn ngày!", type: "error" });
    if (!form.time) return showToast({ text: "Vui lòng chọn giờ!", type: "error" });
    if (!form.services.length) return showToast({ text: "Vui lòng chọn ít nhất một dịch vụ!", type: "error" });

    const payload = {
      idCustomer: customerId,
      idBranch: form.branchId,
      idBarber: form.barberId,
      bookingDate: form.date,
      bookingTime: form.time,
      description: form.services.map((s) => s.name).join(", "),
      services: form.services.map((s) => ({
        idService: s.idService,
        price: s.price,
        quantity: 1,
      })),
      customerName: form.name,
      phoneNumber: phone,
    };
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/booking-direct/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast({ text: `Đặt lịch thất bại: ${data.message || "Lỗi server"}`, type: "error" });
        return;
      }
      showToast({ text: "Đặt lịch trực tiếp thành công!", type: "success" });
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err) {
      console.error("Network error:", err);
      showToast({ text: "Không thể kết nối server!", type: "error" });
    }
  };

  const totalPrice = form.services.reduce((sum, s) => sum + Number(s.price), 0);
  const bookedTimes = form.date ? bookedTimesByDate[form.date] || [] : [];

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.form}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <h2>
          Đặt lịch trực tiếp
          <button
            className={styles.createCustomerBtn}
            onClick={() => setShowCreateCustomer(true)}
          >
            Tạo tài khoản
          </button>
        </h2>

        {/* Popup tạo khách hàng */}
        {showCreateCustomer && (
          <div className={styles.popupOverlay}>
            <div className={styles.popupContent}>
              <button className={styles.closeBtn} onClick={() => setShowCreateCustomer(false)}>✕</button>
              <h3>Tạo khách hàng mới</h3>
              <label>Họ và tên:</label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
              <label>Số điện thoại:</label>
              <input
                type="text"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
              <div className={styles.popupBtnRow}>
                <button className={styles.createBtn} onClick={handleCreateCustomer}>Tạo</button>
                <button className={styles.cancelBtn} onClick={() => setShowCreateCustomer(false)}>Hủy</button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.scrollable}>
          <div className={styles.formContent}>

            {/* Số điện thoại */}
            <div className={styles.section}>
              <label>Số điện thoại khách hàng:</label>
              <div className={styles.phoneRow}>
                <input
                  type="text"
                  placeholder="Nhập SĐT..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button onClick={handleCheck} disabled={checking}>
                  {checking ? "Đang kiểm tra..." : "Kiểm tra"}
                </button>
              </div>
            </div>

            {customerExists && (
              <div className={styles.section}>
                <label>Họ và tên:</label>
                <input type="text" value={form.name} readOnly />
              </div>
            )}

            {/* Chi nhánh */}
            <div className={styles.section}>
              <label>Chi nhánh:</label>
              <select value={form.branchId} onChange={handleBranchChange}>
                <option value="">-- Chọn chi nhánh --</option>
                {branches.map((b) => (
                  <option key={b.idBranch} value={b.idBranch}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Barber */}
{/* Barber */}
<div className={styles.section}>
  <label>Thợ cắt:</label>
  <select value={form.barberId} onChange={handleBarberChange} disabled={!barbers.length}>
    <option value="">-- Chọn thợ cắt --</option>
    {barbers.map((b) => {
      const lockLabel = b.lockDate
        ? ` (nghỉ từ ${new Date(b.lockDate).toLocaleDateString("vi-VN")})`
        : "";
      return (
        <option key={b.idBarber} value={b.idBarber}>
          {b.user?.fullName}{lockLabel}
        </option>
      );
    })}
  </select>

  {/* Gợi ý slot rảnh — chỉ hiện khi chọn ngày hôm nay */}
  {(!form.date || form.date === todayStr) && barbers.length > 0 && (
    <p style={{ fontSize: 12, color: "#a8d8a8", marginTop: 6 }}>
      💡 Gợi ý:{" "}
      {barbers
        .filter((b) => b._nextFreeSlot)
        .slice(0, 3) // chỉ hiện top 3
        .map((b) => `${b.user?.fullName} (${b._nextFreeSlot})`)
        .join(" · ")}
      {barbers.every((b) => !b._nextFreeSlot) && "Tất cả thợ đã hết slot hôm nay"}
    </p>
  )}

  {barberLockDate && (
    <p style={{ fontSize: 12, color: "#e69d9d", marginTop: 6 }}>
      ⚠ Thợ này sẽ nghỉ từ ngày {new Date(barberLockDate).toLocaleDateString("vi-VN")} — chỉ có thể đặt lịch trước ngày đó.
    </p>
  )}
</div>

            {/* Ngày */}
            <div className={styles.section}>
              <label>Ngày:</label>
              <select value={form.date} onChange={handleDateChange}>
                <option value="">-- Chọn ngày --</option>
                {[...Array(14)].map((_, i) => {
                  const d = new Date();
                  d.setDate(today.getDate() + i);
                  const value = d.toISOString().split("T")[0];
                  const label = d.toLocaleDateString("vi-VN", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  const isLocked = isDateBlockedByLock(value);
                  return (
                    <option key={i} value={value} disabled={isLocked}>
                      {label}{isLocked ? " (Thợ nghỉ)" : ""}
                    </option>
                  );
                })}
              </select>
              {dateWarning && (
                <p style={{ fontSize: 12, color: "#e69d9d", marginTop: 6 }}>{dateWarning}</p>
              )}
            </div>

            {/* Giờ */}
            <div className={styles.section}>
              <label>Giờ:</label>
              <div className={styles.timeGrid}>
                {times.map((time, i) => {
                  let isPast = false;
                  if (form.date) {
                    const todayStr = today.toISOString().split("T")[0];
                    if (form.date === todayStr) {
                      const [hh, mm] = time.split(":").map(Number);
                      const slotDate = new Date(today);
                      slotDate.setHours(hh, mm, 0, 0);
                      if (slotDate < today) isPast = true;
                    }
                  }
                  const isBooked = bookedTimes.includes(time);
                  const disabled = isBooked || isPast || !form.date;

                  return (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.timeSlot} ${isBooked || isPast ? styles.booked : ""} ${form.time === time ? styles.selected : ""}`}
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
            <div className={styles.section}>
              <label>Dịch vụ:</label>
              <select onChange={handleServiceAdd} value="">
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((s) => (
                  <option key={s.idService} value={s.idService}>
                    {s.name} - {Number(s.price).toLocaleString()}đ
                  </option>
                ))}
              </select>
              <ul className={styles.serviceList}>
                {form.services.map((s) => (
                  <li key={s.idService}>
                    {s.name} - {Number(s.price).toLocaleString()}đ
                    <button type="button" onClick={() => handleRemoveService(s.idService)}>×</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.section}>
              <p><strong>Tổng tiền:</strong> {totalPrice.toLocaleString("vi-VN")}đ</p>
            </div>

          </div>
        </div>

        <div className={styles.submitContainer}>
          <button 
            className={styles.submitBtn} 
            onClick={handleSubmit}
            disabled={submitting} 
          >
            {submitting ? "Đang xử lý..." : "Xác nhận booking"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
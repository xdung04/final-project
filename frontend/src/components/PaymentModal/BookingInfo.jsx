import React, { useEffect, useState } from "react";
import { PlusCircle, MinusCircle } from "lucide-react";
import styles from "./PaymentModal.module.scss";

export default function BookingInfo({ data, setData, onNext }) {
  const { booking, services, voucher } = data;
  const [branchServices, setBranchServices] = useState([]);
  const [showBranchServices, setShowBranchServices] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  // ✅ Lấy danh sách dịch vụ của chi nhánh
  useEffect(() => {
    if (!booking?.branch) return;

    const fetchBranchServices = async () => {
      try {
        const branchId = booking.branchId || booking.raw?.branch?.idBranch || 1;
        const res = await fetch(`${API_BASE_URL}/bookings/branches/${branchId}`);
        const result = await res.json();

        if (result?.services) {
          setBranchServices(
            result.services.map((s) => ({
              id: s.idService,
              name: s.name,
              price: parseFloat(s.price),
              selected: services.some((sv) => sv.id === s.idService && sv.selected),
            }))
          );
        }
      } catch (error) {
        console.error("Lỗi khi tải dịch vụ của chi nhánh:", error);
      }
    };

    fetchBranchServices();
  }, [booking?.branch]);

  // ✅ Lấy voucher theo booking.idVoucher (nếu có)
  useEffect(() => {
    if (!booking?.idVoucher) return;

    const fetchVoucher = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/vouchers/${booking.idVoucher}`);
        const result = await res.json();

        if (result?.success && result.data) {
          const v = result.data;
          setData((prev) => ({
            ...prev,
            voucher: {
              idVoucher: v.idVoucher,
              title: v.title,
              discountPercent: parseFloat(v.discountPercent),
              expiryDate: v.expiryDate,
            },
          }));
        } else if (result?.title) {
          // fallback nếu API trả trực tiếp object
          setData((prev) => ({
            ...prev,
            voucher: {
              idVoucher: booking.idVoucher,
              title: result.title,
              discountPercent: parseFloat(result.discountPercent || 0),
              expiryDate: result.expiryDate || null,
            },
          }));
        }
      } catch (error) {
        console.error("❌ Lỗi khi tải voucher:", error);
      }
    };

    fetchVoucher();
  }, [booking?.idVoucher]);

  // ✅ Toggle chọn dịch vụ
  const handleToggleService = (id) => {
    const updatedServices = branchServices.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s));
    setBranchServices(updatedServices);
    setData({
      ...data,
      services: updatedServices.filter((s) => s.selected),
    });
  };

  // ✅ Tính toán tổng tiền
  const selectedServices = branchServices.filter((s) => s.selected);
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const discount = voucher?.discountPercent ? (subtotal * voucher.discountPercent) / 100 : 0;
  const total = subtotal - discount;

  return (
    <div className={styles.step1Container}>
      <h2 className={styles.title}>Xác nhận thông tin đặt lịch</h2>

      {/* 🔹 Thông tin cơ bản */}
      <div className={styles.infoBox}>
        <div className={styles.row}>
          <label>Khách hàng:</label>
          <span>{booking.customer}</span>
        </div>
        <div className={styles.row}>
          <label>Thợ cắt:</label>
          <span>{booking.barber}</span>
        </div>
        <div className={styles.row}>
          <label>Thời gian:</label>
          <span>{booking.time}</span>
        </div>
        <div className={styles.row}>
          <label>Chi nhánh:</label>
          <span>{booking.branch}</span>
        </div>
      </div>

      {/* 🔹 Thêm dịch vụ khác */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Thêm dịch vụ khác trong chi nhánh</h3>
          <button className={styles.toggleBtn} onClick={() => setShowBranchServices(!showBranchServices)}>
            {showBranchServices ? (
              <>
                <MinusCircle size={18} /> Ẩn
              </>
            ) : (
              <>
                <PlusCircle size={18} /> Thêm
              </>
            )}
          </button>
        </div>

        {showBranchServices && (
          <ul className={styles.serviceList}>
            {branchServices.map((s) => (
              <li
                key={s.id}
                className={`${styles.serviceItem} ${s.selected ? styles.activeService : ""}`}
                onClick={() => handleToggleService(s.id)}
              >
                <input type="checkbox" checked={s.selected} onChange={() => handleToggleService(s.id)} />
                <span>{s.name}</span>
                <span className={styles.price}>{s.price.toLocaleString()}đ</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🔹 Dịch vụ khách đã chọn */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Dịch vụ khách đã chọn</h3>
        {selectedServices.length === 0 ? (
          <p className={styles.emptyText}>Chưa chọn dịch vụ nào</p>
        ) : (
          <ul className={styles.serviceList}>
            {selectedServices.map((s) => (
              <li key={s.id} className={styles.serviceItem}>
                <span>{s.name}</span>
                <span className={styles.price}>{s.price.toLocaleString()}đ</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🔹 Tổng tiền + Mã giảm giá + Giá cuối */}
      <div className={styles.paymentSummary}>
        <div className={styles.row}>
          <span className={styles.label}>💰 Tổng chi phí:</span>
          <span className={styles.value}>{subtotal.toLocaleString()}đ</span>
        </div>

        {voucher ? (
          <div className={styles.voucherBox}>
            <div className={styles.voucherHeader}>
              <span>
                🎟 <strong>Mã giảm giá:</strong> {voucher.title}
              </span>
              <span className={styles.discountText}>
                Giảm {voucher.discountPercent}% (-{discount.toLocaleString()}đ)
              </span>
            </div>
            {voucher.expiryDate && (
              <p className={styles.voucherExpiry}>
                HSD:{" "}
                {new Date(voucher.expiryDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        ) : (
          <div className={styles.voucherBoxEmpty}>🎟 Chưa áp dụng mã giảm giá</div>
        )}

        <div className={`${styles.row} ${styles.finalPrice}`}>
          <span className={styles.label}>🧾 Giá cuối cùng:</span>
          <strong className={styles.totalValue}>{total.toLocaleString()}đ</strong>
        </div>
      </div>

      <button onClick={onNext} className={styles.nextBtn}>
        Tiếp tục ➜
      </button>
    </div>
  );
}

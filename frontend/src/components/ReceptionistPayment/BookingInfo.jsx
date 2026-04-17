import React, { useEffect, useState } from "react";
import { PlusCircle, MinusCircle, User, Scissors, Clock, MapPin, ReceiptText, Tag } from "lucide-react";
import styles from "./BookingInfo.module.scss"; // 👉 IMPORT FILE SCSS MỚI

export default function BookingInfo({ data, setData, onNext }) {
  const { booking, services, voucher } = data;
  const [branchServices, setBranchServices] = useState([]);
  const [showBranchServices, setShowBranchServices] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Lấy danh sách dịch vụ của chi nhánh
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
  }, [booking?.branch, API_BASE_URL, booking.branchId, booking.raw?.branch?.idBranch, services]);

  // Lấy voucher theo booking.idVoucher
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
  }, [booking?.idVoucher, API_BASE_URL, setData]);

  // Toggle chọn dịch vụ
  const handleToggleService = (id) => {
    const updatedServices = branchServices.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s));
    setBranchServices(updatedServices);
    setData({
      ...data,
      services: updatedServices.filter((s) => s.selected),
    });
  };

  // Tính toán tổng tiền
  const selectedServices = branchServices.filter((s) => s.selected);
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const discount = voucher?.discountPercent ? (subtotal * voucher.discountPercent) / 100 : 0;
  const total = subtotal - discount;
  const handleConfirm = () => {
    // 1. Cập nhật các con số tiền nong vào formData
    const finalData = {
      ...data,
      subtotal: subtotal,
      discount: discount,
      total: total
    };
    
    // 2. Gửi dữ liệu mới nhất này lên cho ReceptionistPayment
    setData(finalData); 
    onNext(finalData); 
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ReceiptText size={24} className={styles.iconGold} />
        <h2>Xác nhận đơn hàng</h2>
        <p>Vui lòng kiểm tra lại thông tin dịch vụ trước khi gửi sang Kiosk.</p>
      </div>

      {/* Thông tin cơ bản */}
      <div className={styles.card}>
        <div className={styles.infoRow}>
          <div className={styles.label}><User size={16} /> Khách hàng</div>
          <div className={styles.value}>{booking.customer}</div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.label}><Scissors size={16} /> Thợ cắt</div>
          <div className={styles.value}>{booking.barber}</div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.label}><Clock size={16} /> Thời gian</div>
          <div className={styles.value}>{booking.time}</div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.label}><MapPin size={16} /> Chi nhánh</div>
          <div className={styles.value}>{booking.branch}</div>
        </div>
      </div>

      {/* Dịch vụ đã chọn */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Dịch vụ sử dụng</h3>
        </div>
        
        {selectedServices.length === 0 ? (
          <div className={styles.emptyState}>Chưa có dịch vụ nào được chọn</div>
        ) : (
          <ul className={styles.serviceList}>
            {selectedServices.map((s) => (
              <li key={s.id} className={styles.serviceItem}>
                <span className={styles.serviceName}>{s.name}</span>
                <span className={styles.servicePrice}>{s.price.toLocaleString("vi-VN")}đ</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Thêm dịch vụ (Upsell) */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Thêm dịch vụ phát sinh</h3>
          <button 
            className={styles.toggleBtn} 
            onClick={() => setShowBranchServices(!showBranchServices)}
          >
            {showBranchServices ? (
              <><MinusCircle size={14} /> Thu gọn</>
            ) : (
              <><PlusCircle size={14} /> Thêm dịch vụ</>
            )}
          </button>
        </div>

        {showBranchServices && (
          <ul className={styles.serviceListExpand}>
            {branchServices.map((s) => (
              <li
                key={s.id}
                className={`${styles.serviceOption} ${s.selected ? styles.selected : ""}`}
                onClick={() => handleToggleService(s.id)}
              >
                <div className={styles.checkboxWrapper}>
                  <input 
                    type="checkbox" 
                    checked={s.selected} 
                    onChange={() => {}} // Đã xử lý ở onClick của thẻ <li>
                  />
                  <span>{s.name}</span>
                </div>
                <span className={styles.price}>{s.price.toLocaleString("vi-VN")}đ</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bill Summary */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span>Tạm tính</span>
          <span>{subtotal.toLocaleString("vi-VN")}đ</span>
        </div>

        {voucher ? (
          <div className={styles.voucherBox}>
            <div className={styles.voucherTop}>
              <div className={styles.voucherTitle}>
                <Tag size={14} /> {voucher.title}
              </div>
              <span className={styles.discountValue}>
                -{discount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className={styles.voucherBottom}>
              Áp dụng giảm {voucher.discountPercent}% trên tổng hóa đơn
            </div>
          </div>
        ) : (
          <div className={styles.voucherEmpty}>
            Không có mã giảm giá áp dụng
          </div>
        )}

        <div className={styles.totalRow}>
          <span>Tổng thanh toán</span>
          <span className={styles.totalPrice}>{total.toLocaleString("vi-VN")}đ</span>
        </div>
      </div>

      <button onClick={handleConfirm} className={styles.btnPrimary}>
        Xác nhận & Gửi tới Kiosk
      </button>
    </div>
  );
}
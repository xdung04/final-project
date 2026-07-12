import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  PlusCircle,
  MinusCircle,
  User,
  Scissors,
  Clock,
  MapPin,
  ReceiptText,
  Tag,
  AlertTriangle,
} from "lucide-react";
import styles from "./BookingInfo.module.scss";

function calcDiscount(voucher, subtotal) {
  if (!voucher || subtotal <= 0) return 0;

  const fixed = parseFloat(voucher.rawDiscountAmount || 0);
  const percent = parseFloat(voucher.rawDiscountPercent || 0);
  const maxDisc = parseFloat(voucher.maxDiscountAmount || 0);

  let disc = 0;
  if (fixed > 0) {
    disc = Math.min(fixed, subtotal);
  } else if (percent > 0) {
    disc = subtotal * (percent / 100);
  }

  if (maxDisc > 0) disc = Math.min(disc, maxDisc);

  return Math.round(disc);
}

export default function BookingInfo({ data, setData, onNext }) {
  const { booking, services, voucher: initialVoucher } = data;

  // Lưu danh sách id service gốc (đã có trong booking lúc đặt)
  const originalServiceIdsRef = useRef(new Set((services || []).map((s) => s.id)));

  const [branchServices, setBranchServices] = useState(() =>
    (services || []).map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,          // Giá gốc lúc đặt (từ booking_details)
      currentPrice: s.currentPrice || s.price, // Giá hiện tại (nếu backend trả về)
      selected: true,
    })),
  );

  const initialVoucherRef = useRef(initialVoucher || null);
  const [showBranchServices, setShowBranchServices] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(initialVoucher || null);
  const [voucherReverted, setVoucherReverted] = useState(false);
  const [revokedVoucherCustomerId, setRevokedVoucherCustomerId] = useState(
    initialVoucher?.customerVoucherId || null,
  );
  const [voucherWarning, setVoucherWarning] = useState("");

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const branchId = booking.branchId;
    if (!branchId) return;

    const fetchBranchServices = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/bookings/branches/${branchId}`,
        );
        const result = await res.json();
        if (result?.services) {
          const allServices = result.services.map((s) => {
            const existing = branchServices.find(
              (bs) => bs.id === s.idService,
            );
            return {
              id: s.idService,
              name: s.name,
              // Hybrid pricing:
              // - Service đã có trong booking gốc → giữ price gốc
              // - Service mới (chưa có trong booking) → dùng currentPrice từ branch
              price: existing
                ? existing.price
                : parseFloat(s.price),
              currentPrice: parseFloat(s.price), // Giá hiện tại
              selected: existing ? existing.selected : false,
            };
          });
          setBranchServices(allServices);
        }
      } catch (err) {
        console.error("Lỗi khi tải dịch vụ chi nhánh:", err);
      }
    };

    fetchBranchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.branchId]);

  const handleToggleService = (id) => {
    const updated = branchServices.map((s) => {
      if (s.id !== id) return s;
      // Khi toggle chọn service mới (chưa có trong booking gốc)
      // → dùng currentPrice (giá hiện tại)
      const isNew = !originalServiceIdsRef.current.has(id);
      return {
        ...s,
        selected: !s.selected,
        price: !s.selected && isNew ? s.currentPrice : s.price,
      };
    });
    setBranchServices(updated);
    setData({ ...data, services: updated.filter((s) => s.selected) });
  };

  const selectedServices = branchServices.filter((s) => s.selected);
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const activeVoucherRef = useRef(activeVoucher);
  useEffect(() => {
    activeVoucherRef.current = activeVoucher;
  }, [activeVoucher]);

  useEffect(() => {
    const original = initialVoucherRef.current;
    if (!original) return;

    const min = parseFloat(original.minInvoiceAmount || 0);

    if (min > 0 && subtotal < min) {
      if (activeVoucherRef.current !== null) {
        setRevokedVoucherCustomerId(original.customerVoucherId || null);
        setActiveVoucher(null);
        setVoucherReverted(true);
      }
      setVoucherWarning(
        `Voucher "${original.name}" tạm bỏ do tổng dịch vụ ` +
          `(${subtotal.toLocaleString("vi-VN")}đ) chưa đạt tối thiểu ` +
          `${min.toLocaleString("vi-VN")}đ`,
      );
    } else {
      if (activeVoucherRef.current === null && voucherReverted) {
        setActiveVoucher(original);
        setVoucherReverted(false);
        setRevokedVoucherCustomerId(null);
      }
      setVoucherWarning("");
    }
  }, [subtotal, voucherReverted]);

  const discountValue = useMemo(
    () => calcDiscount(activeVoucher, subtotal),
    [activeVoucher, subtotal],
  );
  const total = Math.max(0, subtotal - discountValue);

  const renderVoucherDesc = () => {
    if (!activeVoucher) return null;
    const fixed = parseFloat(activeVoucher.rawDiscountAmount || 0);
    const percent = parseFloat(activeVoucher.rawDiscountPercent || 0);
    const maxDisc = parseFloat(activeVoucher.maxDiscountAmount || 0);
    const maxStr =
      maxDisc > 0 ? ` (tối đa ${maxDisc.toLocaleString("vi-VN")}đ)` : "";
    if (fixed > 0) return `Giảm cố định ${fixed.toLocaleString("vi-VN")}đ`;
    return `Giảm ${percent}% trên tổng hóa đơn${maxStr}`;
  };

  const handleConfirm = () => {
    const finalData = {
      ...data,
      subtotal,
      discount: discountValue,
      total,
      voucher: activeVoucher,
      voucherReverted,
      revokedVoucherCustomerId: voucherReverted
        ? revokedVoucherCustomerId
        : null,
    };
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

      <div className={styles.card}>
        <div className={styles.infoRow}>
          <div className={styles.label}>
            <User size={16} /> Khách hàng
          </div>
          <div className={styles.value}>{booking.customer}</div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.label}>
            <Scissors size={16} /> Thợ cắt
          </div>
          <div className={styles.value}>{booking.barber}</div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.label}>
            <Clock size={16} /> Thời gian
          </div>
          <div className={styles.value}>{booking.time}</div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.label}>
            <MapPin size={16} /> Chi nhánh
          </div>
          <div className={styles.value}>{booking.branch}</div>
        </div>
      </div>

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
                <span className={styles.servicePrice}>
                  {s.price.toLocaleString("vi-VN")}đ
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Thêm dịch vụ phát sinh</h3>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowBranchServices(!showBranchServices)}
          >
            {showBranchServices ? (
              <>
                <MinusCircle size={14} /> Thu gọn
              </>
            ) : (
              <>
                <PlusCircle size={14} /> Thêm dịch vụ
              </>
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
                    readOnly
                  />
                  <span>{s.name}</span>
                </div>
                <span className={styles.price}>
                  {s.price.toLocaleString("vi-VN")}đ
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span>Tạm tính</span>
          <span>{subtotal.toLocaleString("vi-VN")}đ</span>
        </div>

        {/* Khối cảnh báo voucher */}
        {voucherWarning && (
          <div className={styles.voucherWarning}>
            <AlertTriangle size={14} />
            <span>{voucherWarning}</span>
          </div>
        )}

        {/* Khối voucher đã được áp dụng */}
        {activeVoucher ? (
          <div className={styles.voucherBox}>
            <div className={styles.voucherTop}>
              <div className={styles.voucherTitle}>
                <Tag size={14} /> {activeVoucher.name}
              </div>
              <span className={styles.discountValue}>
                -{discountValue.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className={styles.voucherBottom}>{renderVoucherDesc()}</div>
          </div>
        ) : !voucherWarning ? (
          <div className={styles.voucherEmpty}>
            Không có mã giảm giá áp dụng
          </div>
        ) : null}

        <div className={styles.totalRow}>
          <span>Tổng thanh toán</span>
          <span className={styles.totalPrice}>
            {total.toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>

      <button type="button" onClick={handleConfirm} className={styles.btnPrimary}>
        Xác nhận & Gửi tới Kiosk
      </button>
    </div>
  );
}
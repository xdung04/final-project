import { useState, useEffect, useMemo } from "react";
import classNames from "classnames/bind";
import * as voucherService from "~/services/voucherService";
import { useAuth } from "~/context/AuthContext";
import styles from "./VoucherPopup.module.scss";

const cx = classNames.bind(styles);

const TYPE_LABEL = {
  NEW_CUSTOMER:    "Khách mới",
  POINTS_EXCHANGE: "Đổi điểm",
  RETENTION:       "Tri ân",
  CAMPAIGN:        "Khuyến mãi",
};

const TYPE_COLOR = {
  NEW_CUSTOMER:    "#4ade80",
  POINTS_EXCHANGE: "#60a5fa",
  RETENTION:       "#f59e0b",
  CAMPAIGN:        "#c084fc",
};

const SOURCE_LABEL = {
  new_customer_welcome: "Voucher chào mừng",
  retention_gift:       "Quà tri ân",
  campaign_collect:     "Từ chiến dịch",
};

function formatMoney(val) {
  if (!val && val !== 0) return "—";
  return Number(val).toLocaleString("vi-VN") + "đ";
}

function daysLeft(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
}

/**
 * Tính số tiền giảm thực tế dựa vào invoiceAmount và cấu trúc voucher.
 * Dùng cho cả VoucherTicket (hiển thị) và logic sort.
 */
export function calcActualDiscount(voucherData, invoiceAmount) {
  if (!voucherData || !invoiceAmount) return 0;

  // POINTS_EXCHANGE: giảm cố định discount_amount
  if (voucherData.discount_amount && Number(voucherData.discount_amount) > 0) {
    let disc = Math.min(Number(voucherData.discount_amount), invoiceAmount);
    if (voucherData.max_discount_amount && disc > Number(voucherData.max_discount_amount)) {
      disc = Number(voucherData.max_discount_amount);
    }
    return disc;
  }

  // Các loại còn lại: giảm theo %
  if (voucherData.discount_percent && Number(voucherData.discount_percent) > 0) {
    let disc = invoiceAmount * (Number(voucherData.discount_percent) / 100);
    if (voucherData.max_discount_amount && disc > Number(voucherData.max_discount_amount)) {
      disc = Number(voucherData.max_discount_amount);
    }
    return disc;
  }

  return 0;
}

/**
 * Kiểm tra voucher trong kho có thỏa mãn điều kiện áp dụng không.
 * Trả về { ok: bool, reason: string | null }
 */
function checkApplicable(cv, invoiceAmount) {
  const voucherData = cv.voucher || cv;

  // Hết hạn
  if (cv.expires_at && new Date(cv.expires_at) < new Date()) {
    return { ok: false, reason: "Voucher đã hết hạn" };
  }

  // Không đủ đơn tối thiểu
  if (
    voucherData.min_invoice_amount &&
    invoiceAmount < Number(voucherData.min_invoice_amount)
  ) {
    return {
      ok: false,
      reason: `Cần đơn từ ${formatMoney(voucherData.min_invoice_amount)}`,
    };
  }

  return { ok: true, reason: null };
}

// ── Voucher ticket (kho) ──────────────────────────────────────────────────────
function VoucherTicket({ cv, isApplied, onApply, invoiceAmount }) {
  const voucherData = cv.voucher || cv;
  const color  = TYPE_COLOR[voucherData.type] || "#b8966a";
  const days   = daysLeft(cv.expires_at);
  const urgent = days !== null && days <= 3;

  const { ok: applicable, reason: disabledReason } = checkApplicable(cv, invoiceAmount);
  const actualDiscount = calcActualDiscount(voucherData, invoiceAmount);

  // Phân biệt POINTS_EXCHANGE (tiền cố định) vs các loại %
  const isFixedAmount =
    voucherData.discount_amount && Number(voucherData.discount_amount) > 0;

  return (
    <div
      className={cx("ticket", {
        applied:  isApplied,
        urgent,
        disabled: !applicable && !isApplied,
      })}
    >
      <div className={cx("ticket-left")} style={{ "--accent": color }}>
        {isFixedAmount ? (
          <>
            <span className={cx("ticket-pct", "ticket-pct--fixed")}>
              {formatMoney(voucherData.discount_amount)}
            </span>
            <span className={cx("ticket-off")}>GIẢM</span>
          </>
        ) : (
          <>
            <span className={cx("ticket-pct")}>{voucherData.discount_percent}%</span>
            <span className={cx("ticket-off")}>GIẢM</span>
          </>
        )}
      </div>

      <div className={cx("ticket-divider")}>
        <span className={cx("hole", "hole-t")} />
        <div className={cx("dash")} />
        <span className={cx("hole", "hole-b")} />
      </div>

      <div className={cx("ticket-right")}>
        <div className={cx("ticket-meta")}>
          <span className={cx("ticket-type")} style={{ color, borderColor: color }}>
            {TYPE_LABEL[voucherData.type] || "Voucher"}
          </span>
          {cv.source_note && SOURCE_LABEL[cv.source_note] && (
            <span className={cx("ticket-source")}>{SOURCE_LABEL[cv.source_note]}</span>
          )}
          {/* Badge giảm thực tế — chỉ hiện khi invoiceAmount > 0 */}
          {invoiceAmount > 0 && applicable && (
            <span className={cx("ticket-actual-discount")}>
              −{formatMoney(actualDiscount)}
            </span>
          )}
        </div>

        <div className={cx("ticket-name")}>{voucherData.name}</div>

        <div className={cx("ticket-conditions")}>
          {!isFixedAmount && voucherData.max_discount_amount && (
            <span>
              Giảm tối đa <strong>{formatMoney(voucherData.max_discount_amount)}</strong>
            </span>
          )}
          {voucherData.min_invoice_amount && (
            <span>
              Đơn từ <strong>{formatMoney(voucherData.min_invoice_amount)}</strong>
            </span>
          )}
        </div>

        <div className={cx("ticket-footer")}>
          <span className={cx("ticket-expire", { urgent })}>
            {!cv.expires_at
              ? "Không hết hạn"
              : urgent
              ? `⚡ Còn ${days} ngày`
              : `HSD: ${new Date(cv.expires_at).toLocaleDateString("vi-VN")}`}
          </span>

          {isApplied ? (
            <span className={cx("applied-tag")}>✓ Đang dùng</span>
          ) : applicable ? (
            <button className={cx("apply-btn")} onClick={() => onApply(cv)}>
              Áp dụng
            </button>
          ) : (
            <span className={cx("disabled-reason")}>{disabledReason}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Exchange ticket (đổi điểm) ────────────────────────────────────────────────
function ExchangeTicket({ voucher, onExchange, invoiceAmount }) {
  const actualDiscount = calcActualDiscount(voucher, invoiceAmount);

  // POINTS_EXCHANGE dùng discount_amount (tiền cố định), không có discount_percent
  const isFixedAmount =
    voucher.discount_amount && Number(voucher.discount_amount) > 0;

  return (
    <div className={cx("ticket", "exchange-ticket")}>
      <div className={cx("ticket-left")} style={{ "--accent": "#60a5fa" }}>
        {isFixedAmount ? (
          <>
            <span className={cx("ticket-pct", "ticket-pct--fixed")}>
              {formatMoney(voucher.discount_amount)}
            </span>
            <span className={cx("ticket-off")}>GIẢM</span>
          </>
        ) : (
          <>
            <span className={cx("ticket-pct")}>{voucher.discount_percent}%</span>
            <span className={cx("ticket-off")}>GIẢM</span>
          </>
        )}
      </div>

      <div className={cx("ticket-divider")}>
        <span className={cx("hole", "hole-t")} />
        <div className={cx("dash")} />
        <span className={cx("hole", "hole-b")} />
      </div>

      <div className={cx("ticket-right")}>
        <div className={cx("ticket-meta")}>
          <span
            className={cx("ticket-type")}
            style={{ color: "#60a5fa", borderColor: "#60a5fa" }}
          >
            Đổi điểm
          </span>
          <span className={cx("ticket-source")}>Dùng điểm tích lũy</span>
          {invoiceAmount > 0 && (
            <span className={cx("ticket-actual-discount")}>
              −{formatMoney(actualDiscount)}
            </span>
          )}
        </div>

        <div className={cx("ticket-name")}>{voucher.name}</div>

        <div className={cx("ticket-conditions")}>
          {!isFixedAmount && voucher.max_discount_amount && (
            <span>
              Giảm tối đa <strong>{formatMoney(voucher.max_discount_amount)}</strong>
            </span>
          )}
          {voucher.min_invoice_amount && (
            <span>
              Đơn từ <strong>{formatMoney(voucher.min_invoice_amount)}</strong>
            </span>
          )}
        </div>

        <div className={cx("ticket-footer")}>
          <span className={cx("cost-tag")}>{voucher.points_required} điểm</span>
          <button className={cx("exchange-btn")} onClick={() => onExchange(voucher)}>
            Đổi ngay
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm exchange ──────────────────────────────────────────────────────────
function ConfirmExchange({ voucher, onConfirm, onCancel, loading }) {
  if (!voucher) return null;
  return (
    <div className={cx("confirm-overlay")} onClick={onCancel}>
      <div className={cx("confirm-box")} onClick={(e) => e.stopPropagation()}>
        <div className={cx("confirm-label")}>Xác nhận đổi điểm</div>
        <div className={cx("confirm-name")}>{voucher.name}</div>
        <p className={cx("confirm-desc")}>
          Bạn có chắc muốn đổi{" "}
          <strong>{voucher.points_required} điểm</strong>{" "}
          để nhận voucher này không?
        </p>
        <div className={cx("confirm-actions")}>
          <button
            className={cx("confirm-cancel")}
            onClick={onCancel}
            disabled={loading}
          >
            Huỷ
          </button>
          <button
            className={cx("confirm-ok")}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang đổi..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
/**
 * Props:
 *   onClose        — đóng popup
 *   onSelect       — callback(voucher | null) khi áp dụng / bỏ
 *   defaultVoucher — voucher đang được áp dụng (nếu có)
 *   invoiceAmount  — tổng tiền dịch vụ hiện tại từ BookingPage (dùng để check & sort)
 */
function VoucherPopup({ onClose, onSelect, defaultVoucher, invoiceAmount = 0 }) {
  const { isLogin } = useAuth();

  const [availableVouchers,    setAvailableVouchers]    = useState([]);
  const [exchangeableVouchers, setExchangeableVouchers] = useState([]);
  const [appliedVoucher,       setAppliedVoucher]       = useState(defaultVoucher || null);
  const [loading,              setLoading]              = useState(true);
  const [confirmVoucher,       setConfirmVoucher]       = useState(null);
  const [exchanging,           setExchanging]           = useState(false);

  useEffect(() => {
    if (!isLogin) return;
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const [myVouchers, exchangeable] = await Promise.all([
          voucherService.fetchMyVouchers(),
          voucherService.fetchExchangeableVouchers(),
        ]);
        setAvailableVouchers(myVouchers || []);
        setExchangeableVouchers(exchangeable || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách voucher:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, [isLogin]);

  /**
   * Sort voucher: applicable lên trước, trong applicable sort theo actual discount giảm dần.
   * Disabled (không đủ điều kiện) xuống sau.
   */
  const sortedAvailableVouchers = useMemo(() => {
    return [...availableVouchers].sort((a, b) => {
      const { ok: okA } = checkApplicable(a, invoiceAmount);
      const { ok: okB } = checkApplicable(b, invoiceAmount);

      // Applicable lên trước disabled
      if (okA && !okB) return -1;
      if (!okA && okB) return 1;

      // Cùng nhóm: sort theo actual discount giảm dần
      const discA = calcActualDiscount(a.voucher || a, invoiceAmount);
      const discB = calcActualDiscount(b.voucher || b, invoiceAmount);
      return discB - discA;
    });
  }, [availableVouchers, invoiceAmount]);

  const handleApplyVoucher = (cv) => {
    setAppliedVoucher(cv);
    onSelect(cv);
    onClose();
  };

  const handleRemoveApplied = () => {
    setAppliedVoucher(null);
    onSelect(null);
    onClose();
  };

  const handleConfirmExchange = async () => {
    if (!confirmVoucher) return;
    setExchanging(true);
    try {
      await voucherService.exchangeVoucher( confirmVoucher.id);
      const [updatedMy, updatedExchange] = await Promise.all([
        voucherService.fetchMyVouchers(),
        voucherService.fetchExchangeableVouchers(),
      ]);
      setAvailableVouchers(updatedMy || []);
      setExchangeableVouchers(updatedExchange || []);
      setConfirmVoucher(null);
    } catch (error) {
      console.error(error.response?.data?.message || "Đổi voucher thất bại!");
    } finally {
      setExchanging(false);
    }
  };

  const hasContent =
    availableVouchers.length > 0 || exchangeableVouchers.length > 0;

  // Chỉ hiện exchangeable voucher có can_exchange = true
  const canExchangeList = exchangeableVouchers.filter((v) => v.can_exchange);

  return (
    <>
      <div className={cx("overlay")} onClick={onClose}>
        <div className={cx("popup")} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className={cx("popup-header")}>
            <div className={cx("popup-title")}>
              <span className={cx("popup-label")}>ƯU ĐÃI</span>
              <h3>Chọn <em>Voucher</em></h3>
            </div>
            <button className={cx("close-btn")} onClick={onClose}>✕</button>
          </div>

          {/* Applied banner */}
          {appliedVoucher && (
            <div className={cx("applied-banner")}>
              <span>
                ✓ Đang áp dụng:{" "}
                <strong>{appliedVoucher.voucher?.name || appliedVoucher.name}</strong>
              </span>
              <button onClick={handleRemoveApplied}>Bỏ áp dụng</button>
            </div>
          )}

          {/* Invoice amount hint */}
          {invoiceAmount > 0 && (
            <div className={cx("invoice-hint")}>
              Đơn hiện tại: <strong>{formatMoney(invoiceAmount)}</strong>
            </div>
          )}

          {/* Body */}
          <div className={cx("popup-body")}>
            {loading ? (
              <div className={cx("loading")}>Đang tải...</div>
            ) : !hasContent ? (
              <div className={cx("empty")}>
                <span className={cx("empty-icon")}>🎟</span>
                <p>Bạn chưa có voucher nào và chưa đủ điểm để đổi</p>
              </div>
            ) : (
              <div className={cx("list")}>
                {/* Kho voucher — đã sort theo applicable + discount cao nhất */}
                {sortedAvailableVouchers.length > 0 && (
                  <>
                    <div className={cx("list-label")}>Voucher trong kho</div>
                    {sortedAvailableVouchers.map((cv) => (
                      <VoucherTicket
                        key={cv.id}
                        cv={cv}
                        isApplied={appliedVoucher?.id === cv.id}
                        onApply={handleApplyVoucher}
                        invoiceAmount={invoiceAmount}
                      />
                    ))}
                  </>
                )}

                {/* Đổi điểm — chỉ hiện những cái can_exchange = true */}
                {canExchangeList.length > 0 && (
                  <>
                    <div className={cx("list-label")}>Đổi điểm lấy voucher</div>
                    {canExchangeList.map((v) => (
                      <ExchangeTicket
                        key={v.id}
                        voucher={v}
                        onExchange={setConfirmVoucher}
                        invoiceAmount={invoiceAmount}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={cx("popup-footer")}>
            <button className={cx("footer-close")} onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>

      <ConfirmExchange
        voucher={confirmVoucher}
        onConfirm={handleConfirmExchange}
        onCancel={() => setConfirmVoucher(null)}
        loading={exchanging}
      />
    </>
  );
}

export default VoucherPopup;
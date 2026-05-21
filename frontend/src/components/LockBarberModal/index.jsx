import React, { useState } from "react";
import { CalendarClock, X } from "lucide-react";
import { BarberAPI } from "~/apis/barberAPI";

function LockDateModal({ barber, onClose, onSuccess, showToast }) {
  const [lockDate, setLockDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Minimum selectable date = tomorrow
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lockDate) {
      showToast("error", "Vui lòng chọn ngày khóa!");
      return;
    }

    setLoading(true);

    try {
      const res = await BarberAPI.setLockDate(barber.idBarber, lockDate);

      if (!res?.success) {
        showToast("error", res?.message || "Không thể cài đặt ngày khóa!");
        return;
      }

      showToast("success", res.message);

      // QUAN TRỌNG
      await onSuccess();

      // đóng modal fallback nếu parent quên đóng
      onClose();
    } catch (err) {
      console.error(err);

      showToast("error", err?.response?.data?.message || err?.message || "Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Modal overlay — uses the same inline style pattern as branch suspend modal
       so it inherits all existing ChiNhanh/ThoCatToc modal styling */
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,12,10,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--color-background-primary)",
          borderRadius: 16,
          width: 420,
          maxWidth: "100%",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#1A1612",
            padding: "18px 22px",
            borderBottom: "1px solid rgba(201,168,76,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CalendarClock size={20} color="#C9A84C" />
          <span
            style={{
              color: "#F5F0E8",
              fontWeight: 600,
              fontSize: 15,
              fontFamily: "Georgia, serif",
            }}
          >
            Lên lịch khóa tài khoản
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
            Tài khoản của <strong>{barber?.fullName}</strong> sẽ tự động bị khóa vào ngày bạn chọn. Hệ thống sẽ kiểm tra
            và từ chối nếu còn lịch hẹn chưa hoàn tất.
          </p>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="lock-date-input"
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                color: "#aaa",
                marginBottom: 6,
              }}
            >
              Ngày khóa tài khoản
            </label>
            <input
              id="lock-date-input"
              type="date"
              value={lockDate}
              min={tomorrow}
              onChange={(e) => setLockDate(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 11px",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "inherit",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#C9A84C",
                  color: "#1A1612",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LockDateModal;

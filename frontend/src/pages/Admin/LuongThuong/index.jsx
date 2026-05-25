// LuongThuong.jsx — FULLY WIRED
// Fix: createPortal (modal luôn căn giữa viewport)
// Fix: Toast thay alert(), ConfirmModal thay window.confirm()

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import styles from "./LuongThuong.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faCalculator, faEye,
  faPenToSquare, faPaperPlane, faMoneyBillWave,
  faRotateLeft, faXmark, faTriangleExclamation,
  faBan, faChevronDown, faArrowsRotate, faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { SalaryAPI } from "~/apis/salaryAPI";
import Toast from "~/components/Toast";

const cx = classNames.bind(styles);

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_META = {
  Realtime:      { label: "Xem trực tiếp",  cls: "realtime",      icon: "📡" },
  Draft:         { label: "Bản nháp",       cls: "draft",         icon: "📝" },
  Pending:       { label: "Chờ xác nhận",   cls: "pending",       icon: "🕐" },
  Disputed:      { label: "Có khiếu nại",   cls: "disputed",      icon: "⚠️" },
  Confirmed:     { label: "Đã xác nhận",    cls: "confirmed",     icon: "✅" },
  AutoConfirmed: { label: "Tự xác nhận",    cls: "autoconfirmed", icon: "⏱"  },
  Paid:          { label: "Đã thanh toán",  cls: "paid",          icon: "💸" },
  Locked:        { label: "Đã khóa",        cls: "locked",        icon: "🔒" },
  Cancelled:     { label: "Đã huỷ",         cls: "cancelled",     icon: "🚫" },
};

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

const calcNet = (s) =>
  (s.baseSalary || 0) + (s.commission || 0) + (s.tip || 0) + (s.bonus || 0)
  - (s.advance || 0) - (s.deduction || 0);

// ─── Toast hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const ToastContainer = () =>
    toasts.length > 0
      ? createPortal(
          <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
            {toasts.map((t) => (
              <Toast key={t.id} type={t.type} message={t.message} />
            ))}
          </div>,
          document.body
        )
      : null;

  return { showToast, ToastContainer };
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
// Thay thế window.confirm() — render qua portal
function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Xác nhận", danger = false }) {
  if (!open) return null;
  return createPortal(
    <div
      className={cx("overlay")}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      style={{ zIndex: 500 }}
    >
      <div className={cx("modal")} style={{ width: 420 }} role="alertdialog" aria-modal="true">
        <div className={cx("modalTitle")}>{title}</div>
        <div className={cx("modalSub")} style={{ paddingBottom: 20 }}>{message}</div>
        <div className={cx("modalActions")}>
          <button className={cx("btn", "btn-ghost")} onClick={onCancel}>Huỷ</button>
          <button
            className={cx("btn", danger ? "btn-danger" : "btn-send")}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── useConfirm hook ──────────────────────────────────────────────────────────
function useConfirm() {
  const [state, setState] = useState({ open: false, title: "", message: "", resolve: null, danger: false, confirmLabel: "Xác nhận" });

  const confirm = useCallback(({ title, message, confirmLabel, danger }) =>
    new Promise((resolve) => {
      setState({ open: true, title, message, confirmLabel: confirmLabel || "Xác nhận", danger: !!danger, resolve });
    }), []);

  const handleConfirm = () => {
    state.resolve(true);
    setState((s) => ({ ...s, open: false }));
  };
  const handleCancel = () => {
    state.resolve(false);
    setState((s) => ({ ...s, open: false }));
  };

  const ConfirmContainer = () => (
    <ConfirmModal
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      danger={state.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmContainer };
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, variant, pulse }) {
  return (
    <div className={cx("statCard", `stat-${variant}`, { "stat-pulse": pulse })}>
      <div className={cx("statLabel")}>{label}</div>
      <div className={cx("statVal")}>{value}</div>
      {sub && <div className={cx("statSub")}>{sub}</div>}
    </div>
  );
}

function Badge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Draft;
  return (
    <span className={cx("badge", `badge-${meta.cls}`)}>
      {meta.icon} {meta.label}
    </span>
  );
}

function DisputeTag({ count }) {
  if (!count) return null;
  return <span className={cx("disputeTag")}>{count}/2</span>;
}

// ─── Source Banner ────────────────────────────────────────────────────────────
function SourceBanner({ source, isCurrentMonth, canCalculate, message }) {
  if (source === "database") return null;
  return (
    <div className={cx("sourceBanner", isCurrentMonth ? "banner-info" : "banner-warn")}>
      <FontAwesomeIcon icon={faCircleInfo} />
      <span>
        {isCurrentMonth
          ? "📡 Đang xem dữ liệu thời gian thực — Chưa hết tháng nên chưa thể tính lương."
          : `⚠ Tháng này chưa tính lương. ${message || "Bấm 'Tính lương (Nháp)' để lưu vào hệ thống."}`
        }
      </span>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
// FIX: dùng createPortal → overlay render thẳng vào document.body
// → position: fixed luôn căn giữa viewport, không bị trap bởi parent transform
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div
      className={cx("overlay")}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cx("modal")} role="dialog" aria-modal="true">
        <button className={cx("modalClose")} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
        {children}
      </div>
    </div>,
    document.body  // ← thoát hoàn toàn khỏi DOM tree của trang
  );
}

// ─── Deduction Modal ──────────────────────────────────────────────────────────
function DeductionModal({ data, onClose, onAdd, onRemove, loading, showToast }) {
  const [amount,        setAmount]        = useState("");
  const [reason,        setReason]        = useState("");
  const [violationDate, setViolationDate] = useState("");
  const [removeReason,  setRemoveReason]  = useState("");
  const [removingId,    setRemovingId]    = useState(null);

  useEffect(() => {
    if (data) {
      setAmount("");
      setReason("");
      setViolationDate("");
      setRemoveReason("");
      setRemovingId(null);
    }
  }, [data?.idSalary]);

  const deductions = data?.DeductionsList || [];

  const previewNet =
    (data?.baseSalary || 0) + (data?.commission || 0) +
    (data?.tip || 0)        + (data?.bonus || 0) -
    (data?.deductions || 0);

  const handleAdd = () => {
    if (!amount || Number(amount) <= 0) {
      showToast("error", "Số tiền phải lớn hơn 0");
      return;
    }
    if (!reason.trim()) {
      showToast("error", "Vui lòng nhập lý do khấu trừ");
      return;
    }
    onAdd(data.idSalary, {
      amount:        Number(amount),
      reason:        reason.trim(),
      violationDate: violationDate || null,
    });
    setAmount("");
    setReason("");
    setViolationDate("");
  };

  const handleRemoveConfirm = (idDeduction) => {
    if (!removeReason.trim()) {
      showToast("error", "Vui lòng nhập lý do xóa");
      return;
    }
    onRemove(idDeduction, removeReason.trim());
    setRemovingId(null);
    setRemoveReason("");
  };

  return (
    <Modal open={!!data} onClose={onClose}>
      <div className={cx("modalTitle")}>✏️ Quản lý khấu trừ</div>
      <div className={cx("modalSub")}>
        {data?.barberName} &nbsp;·&nbsp; Tháng {data?.month}/{data?.year}
      </div>

      {/* ── Danh sách khoản đã có ── */}
      <div className={cx("deductionListSection")}>
        <div className={cx("deductionListTitle")}>
          Các khoản đã khấu trừ
          {deductions.length > 0 && (
            <span className={cx("deductionTotal")}>Tổng: {fmt(data?.deductions || 0)}</span>
          )}
        </div>

        {deductions.length === 0 ? (
          <div className={cx("deductionEmpty")}>Chưa có khoản khấu trừ nào</div>
        ) : (
          <div className={cx("deductionList")}>
            {deductions.map((d) => (
              <div key={d.idDeduction} className={cx("deductionItem")}>
                <div className={cx("deductionItemLeft")}>
                  <span className={cx("deductionAmount")}>−{fmt(d.amount)}</span>
                  <span className={cx("deductionReason")}>{d.reason}</span>
                  {d.violationDate && (
                    <span className={cx("deductionViolationDate")}>
                      📅 Vi phạm: {new Date(d.violationDate).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                  <span className={cx("deductionDate")}>
                    Nhập ngày: {new Date(d.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                {removingId === d.idDeduction ? (
                  <div className={cx("removeForm")}>
                    <input
                      type="text"
                      className={cx("formInput", "removeInput")}
                      placeholder="Lý do xóa..."
                      value={removeReason}
                      onChange={(e) => setRemoveReason(e.target.value)}
                      autoFocus
                    />
                    <button
                      className={cx("btn", "btn-danger", "btn-xs")}
                      onClick={() => handleRemoveConfirm(d.idDeduction)}
                      disabled={loading}
                    >
                      Xác nhận
                    </button>
                    <button
                      className={cx("btn", "btn-ghost", "btn-xs")}
                      onClick={() => { setRemovingId(null); setRemoveReason(""); }}
                    >
                      Huỷ
                    </button>
                  </div>
                ) : (
                  <button
                    className={cx("iconBtn", "deductionRemoveBtn")}
                    onClick={() => { setRemovingId(d.idDeduction); setRemoveReason(""); }}
                    title="Xóa khoản này"
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cx("deductionDivider")} />

      {/* ── Form thêm khoản mới ── */}
      <div className={cx("deductionListTitle")}>Thêm khoản khấu trừ mới</div>

      <div className={cx("formRow")}>
        <div className={cx("formGroup", "formGroupAmount")}>
          <label className={cx("formLabel")}>Số tiền (đ)</label>
          <input
            type="number" className={cx("formInput")}
            value={amount} min="0" placeholder="VD: 200000"
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className={cx("formGroup", "formGroupReason")}>
          <label className={cx("formLabel")}>Lý do</label>
          <input
            type="text" className={cx("formInput")}
            value={reason} placeholder="VD: Đi muộn 3 lần"
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>

      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>
          Ngày vi phạm
          <span className={cx("formLabelHint")}> (không bắt buộc)</span>
        </label>
        <input
          type="date" className={cx("formInput")}
          value={violationDate}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setViolationDate(e.target.value)}
        />
      </div>

      <div className={cx("previewBox")}>
        <span>Thực nhận hiện tại</span>
        <span className={cx("previewVal")}>{fmt(previewNet)}</span>
      </div>

      <div className={cx("modalActions")}>
        <button className={cx("btn", "btn-ghost")} onClick={onClose}>Đóng</button>
        <button
          className={cx("btn", "btn-gold")}
          onClick={handleAdd}
          disabled={loading || !amount || !reason.trim()}
        >
          {loading ? "Đang lưu..." : "➕ Thêm khấu trừ"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Dispute View Modal ───────────────────────────────────────────────────────
function DisputeViewModal({ data, onClose, onForceClose, onEditAndResend, loading, showToast }) {
  const [reason, setReason] = useState("");

  useEffect(() => { if (data) setReason(""); }, [data]);

  const handleForceClose = () => {
    if (!reason.trim()) {
      showToast("error", "Vui lòng nhập lý do từ chối trước khi Force-close");
      return;
    }
    onForceClose(reason);
  };

  return (
    <Modal open={!!data} onClose={onClose}>
      <div className={cx("modalTitle")}>⚠️ Xử lý khiếu nại</div>
      <div className={cx("modalSub")}>
        {data?.barberName} &nbsp;·&nbsp; Tháng {data?.month}/{data?.year}
      </div>

      <div className={cx("disputeBox")}>
        <div className={cx("disputeBoxLabel")}>Lý do khiếu nại từ thợ</div>
        <div className={cx("disputeBoxText")}>{data?.disputeReason || "—"}</div>
      </div>
      <div className={cx("disputeCountRow")}>
        Số lần khiếu nại: <strong>{data?.disputeCount || 0}/2</strong>
      </div>

      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Lý do từ chối (nếu Force-close)</label>
        <textarea
          className={cx("formTextarea")} rows={3}
          value={reason} placeholder="Nhập lý do để đóng khiếu nại..."
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className={cx("modalActions")}>
        <button className={cx("btn", "btn-ghost")} onClick={onClose}>Đóng</button>
        <button
          className={cx("btn", "btn-danger", "btn-sm")}
          onClick={handleForceClose}
          disabled={loading || !reason.trim()}
        >
          <FontAwesomeIcon icon={faBan} /> Force-close
        </button>
        <button
          className={cx("btn", "btn-send", "btn-sm")}
          onClick={onEditAndResend}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPenToSquare} /> Sửa &amp; Gửi lại
        </button>
      </div>
    </Modal>
  );
}

// ─── Payslip Detail Modal ─────────────────────────────────────────────────────
function PayslipModal({ data, onClose }) {
  if (!data) return null;
  const totalIncome =
    (data.baseSalary || 0) + (data.commission || 0) +
    (data.tip || 0) + (data.bonus || 0);
  const totalDeduct = data.deductions || 0;
  const net = totalIncome - totalDeduct;

  return (
    <Modal open={!!data} onClose={onClose}>
      <div className={cx("modalTitle")}>👁 Chi tiết phiếu lương</div>
      <div className={cx("modalSub")}>
        {data.barberName} &nbsp;·&nbsp; Tháng {data.month}/{data.year}
      </div>

      <div className={cx("breakdownGrid")}>
        {[
          ["Lương cơ bản", data.baseSalary, "plus"],
          ["Hoa hồng",     data.commission, "plus"],
          ["Tip",          data.tip,        "plus"],
          ["Thưởng KPI",   data.bonus,      "plus"],
        ].map(([label, val, cls]) => (
          <div key={label} className={cx("breakdownItem")}>
            <div className={cx("biLabel")}>{label}</div>
            <div className={cx("biVal", cls)}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      <div className={cx("totalRow")}>
        <span>Tổng thu nhập</span>
        <span className={cx("mono")}>{fmt(totalIncome)}</span>
      </div>
      <div className={cx("totalRow", "minus")}>
        <span>Khấu trừ</span>
        <span className={cx("mono", "cRed")}>−{fmt(totalDeduct)}</span>
      </div>

      {data.DeductionsList?.length > 0 && (
        <div className={cx("deductionBreakdown")}>
          {data.DeductionsList.map((d) => (
            <div key={d.idDeduction} className={cx("deductionBreakdownItem")}>
              <span className={cx("cMuted")}>
                {new Date(d.createdAt).toLocaleDateString("vi-VN")} — {d.reason}
              </span>
              <span className={cx("cRed")}>−{fmt(d.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className={cx("totalRow", "highlight")}>
        <span>💰 Thực nhận</span>
        <span className={cx("mono", "cGold", "bigNum")}>{fmt(net)}</span>
      </div>

      <div className={cx("modalActions")}>
        <button className={cx("btn", "btn-ghost")} onClick={onClose}>Đóng</button>
      </div>
    </Modal>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ data, onClose, onConfirm, loading, showToast }) {
  const [paidAmount, setPaidAmount] = useState(0);
  const [proofUrl, setProofUrl]     = useState("");

  useEffect(() => {
    if (data) {
      setPaidAmount(calcNet(data));
      setProofUrl("");
    }
  }, [data]);

  const net       = data ? calcNet(data) : 0;
  const isPartial = Number(paidAmount) < net && Number(paidAmount) > 0;

  const handleConfirm = () => {
    if (!paidAmount || Number(paidAmount) <= 0) {
      showToast("error", "Số tiền thanh toán phải lớn hơn 0");
      return;
    }
    onConfirm({ paidAmount: Number(paidAmount), paymentProofUrl: proofUrl });
  };

  return (
    <Modal open={!!data} onClose={onClose}>
      <div className={cx("modalTitle")}>💸 Xác nhận thanh toán</div>
      <div className={cx("modalSub")}>
        {data?.barberName} &nbsp;·&nbsp; Thực nhận: <strong>{fmt(net)}</strong>
      </div>

      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Số tiền thanh toán (đ)</label>
        <input
          type="number" className={cx("formInput")}
          value={paidAmount} min="0" max={net}
          onChange={(e) => setPaidAmount(e.target.value)}
        />
        {isPartial && (
          <span className={cx("inputHint", "warn")}>
            ⚠ Thanh toán một phần — còn lại {fmt(net - Number(paidAmount))}
          </span>
        )}
      </div>
      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Mã / URL bill chuyển khoản</label>
        <input
          type="text" className={cx("formInput")}
          value={proofUrl} placeholder="VD: FT25091234567"
          onChange={(e) => setProofUrl(e.target.value)}
        />
      </div>

      <div className={cx("lockWarning")}>
        ⚠ Sau khi xác nhận, phiếu sẽ bị <strong>KHÓA VĨNH VIỄN</strong>. Không thể hoàn tác!
      </div>

      <div className={cx("modalActions")}>
        <button className={cx("btn", "btn-ghost")} onClick={onClose}>Huỷ</button>
        <button
          className={cx("btn", "btn-success")}
          onClick={handleConfirm}
          disabled={loading || !paidAmount || Number(paidAmount) <= 0}
        >
          {loading ? "Đang xử lý..." : "✅ Xác nhận & Khóa sổ"}
        </button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Main Component ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
function LuongThuong() {
  const today = new Date();

  const [month, setMonth]   = useState(today.getMonth() + 1);
  const [year, setYear]     = useState(today.getFullYear());
  const [search, setSearch] = useState("");

  const [salaries, setSalaries]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [dataSource, setDataSource]     = useState("realtime");
  const [canCalculate, setCanCalculate] = useState(false);
  const [sourceMessage, setSourceMessage] = useState("");

  // Modal states
  const [editingRow, setEditingRow] = useState(null);
  const [disputeRow, setDisputeRow] = useState(null);
  const [payslipRow, setPayslipRow] = useState(null);
  const [paymentRow, setPaymentRow] = useState(null);

  // Toast + Confirm
  const { showToast, ToastContainer } = useToast();
  const { confirm, ConfirmContainer } = useConfirm();

  // ── Fetch data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async (m, y) => {
    setLoading(true);
    try {
      const res = await SalaryAPI.getSalaries(m, y);
      setDataSource(res.source || "realtime");
      setCanCalculate(res.canCalculate || false);
      setSourceMessage(res.message || "");
      setSalaries(Array.isArray(res.salaries) ? res.salaries : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu lương:", err);
      showToast("error", "Không thể tải dữ liệu lương. Vui lòng thử lại!");
      setSalaries([]);
      setCanCalculate(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(month, year);
  }, [month, year, fetchData]);

  // ── Derived state ────────────────────────────────────────────────────────
  const isCurrentMonth =
    month === today.getMonth() + 1 && year === today.getFullYear();

  const counts = {
    Draft:     salaries.filter((s) => s.status === "Draft").length,
    Pending:   salaries.filter((s) => ["Pending", "AutoConfirmed"].includes(s.status)).length,
    Disputed:  salaries.filter((s) => s.status === "Disputed").length,
    Confirmed: salaries.filter((s) => s.status === "Confirmed").length,
    Paid:      salaries.filter((s) => ["Paid", "Locked"].includes(s.status)).length,
  };

  const filtered = salaries.filter((s) =>
    (s.barberName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.branchName || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── withLoading helper ───────────────────────────────────────────────────
  const withLoading = async (fn) => {
    setActionLoading(true);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.error || err.message || "Có lỗi xảy ra!");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Action: Tính lương nháp ──────────────────────────────────────────────
  const handleCalculateDraft = () =>
    withLoading(async () => {
      await SalaryAPI.createDraftSalaries(month, year);
      await fetchData(month, year);
      showToast("success", `Đã tính lương nháp tháng ${month}/${year} thành công!`);
    });

  // ── Action: Gửi tất cả phiếu Draft ──────────────────────────────────────
  const handleSendAll = async () => {
    const drafts = salaries.filter((s) => s.status === "Draft");
    if (!drafts.length) {
      showToast("error", "Không có phiếu nào ở trạng thái Bản nháp để gửi!");
      return;
    }

    const ok = await confirm({
      title: "📤 Gửi tất cả phiếu lương",
      message: `Xác nhận gửi phiếu lương cho ${drafts.length} thợ tháng ${month}/${year}?`,
      confirmLabel: "Gửi tất cả",
    });
    if (!ok) return;

    withLoading(async () => {
      for (const s of drafts) {
        await SalaryAPI.sendPayslip(s.idSalary);
      }
      await fetchData(month, year);
      showToast("success", `Đã gửi phiếu lương cho ${drafts.length} thợ!`);
    });
  };

  // ── Action: Gửi 1 phiếu ─────────────────────────────────────────────────
  const handleSendOne = (s) =>
    withLoading(async () => {
      await SalaryAPI.sendPayslip(s.idSalary);
      await fetchData(month, year);
      showToast("success", `Đã gửi phiếu lương cho ${s.barberName}!`);
    });

  // ── Action: Thêm khoản khấu trừ ─────────────────────────────────────────
  const handleAddDeduction = (idSalary, { amount, reason, violationDate }) =>
    withLoading(async () => {
      await SalaryAPI.addDeduction(idSalary, { amount, reason, violationDate });
      const res = await SalaryAPI.getSalaries(month, year);
      setSalaries(Array.isArray(res.salaries) ? res.salaries : []);
      const updated = res.salaries?.find((s) => s.idSalary === idSalary);
      if (updated) setEditingRow(updated);
      showToast("success", `Đã thêm khấu trừ ${fmt(amount)}!`);
    });

  // ── Action: Xóa mềm một khoản khấu trừ ─────────────────────────────────
  const handleRemoveDeduction = (idDeduction, deleteReason) =>
    withLoading(async () => {
      await SalaryAPI.removeDeduction(idDeduction, deleteReason);
      const res = await SalaryAPI.getSalaries(month, year);
      setSalaries(Array.isArray(res.salaries) ? res.salaries : []);
      if (editingRow) {
        const updated = res.salaries?.find((s) => s.idSalary === editingRow.idSalary);
        if (updated) setEditingRow(updated);
      }
      showToast("success", "Đã xóa khoản khấu trừ!");
    });

  // ── Action: Force-close khiếu nại ───────────────────────────────────────
  const handleForceClose = (reason) =>
    withLoading(async () => {
      await SalaryAPI.forceCloseDispute(disputeRow.idSalary, reason);
      setDisputeRow(null);
      await fetchData(month, year);
      showToast("success", "Đã đóng khiếu nại thành công!");
    });

  // ── Action: Mở form sửa từ dispute ──────────────────────────────────────
  const handleEditAndResend = () => {
    const row = disputeRow;
    setDisputeRow(null);
    setEditingRow(row);
  };

  // ── Action: Thanh toán 1 phiếu ──────────────────────────────────────────
  const handlePayment = (payload) =>
    withLoading(async () => {
      await SalaryAPI.markAsPaid(paymentRow.idSalary, payload);
      setPaymentRow(null);
      await fetchData(month, year);
      showToast("success", `Đã thanh toán và khóa sổ cho ${paymentRow.barberName}!`);
    });

  // ── Action: Đánh dấu tất cả Confirmed → Paid ────────────────────────────
  const handleMarkAllPaid = async () => {
    const confirmed = salaries.filter((s) =>
      ["Confirmed", "AutoConfirmed"].includes(s.status)
    );
    if (!confirmed.length) {
      showToast("error", "Chưa có thợ nào ở trạng thái Đã xác nhận!");
      return;
    }

    const ok = await confirm({
      title: "💸 Thanh toán tất cả",
      message: `Đánh dấu đã thanh toán cho ${confirmed.length} thợ? Hành động này sẽ khóa tất cả phiếu.`,
      confirmLabel: "Xác nhận thanh toán",
      danger: true,
    });
    if (!ok) return;

    withLoading(async () => {
      for (const s of confirmed) {
        await SalaryAPI.markAsPaid(s.idSalary, {
          paidAmount: calcNet(s),
          paymentProofUrl: "",
        });
      }
      await fetchData(month, year);
      showToast("success", `Đã thanh toán cho ${confirmed.length} thợ!`);
    });
  };

  // ── Render actions per row ───────────────────────────────────────────────
  const renderActions = (s) => {
    if (s.status === "Realtime") {
      return (
        <div className={cx("actionCell")}>
          <button
            className={cx("iconBtn")}
            onClick={() => setPayslipRow({ ...s, month, year })}
            title="Xem chi tiết"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
        </div>
      );
    }

    const locked    = ["Paid", "Locked", "Cancelled"].includes(s.status);
    const canEdit   = ["Draft", "Disputed"].includes(s.status);
    const canSend   = s.status === "Draft";
    const canResend = s.status === "Disputed";
    const canPay    = ["Confirmed", "AutoConfirmed"].includes(s.status);

    return (
      <div className={cx("actionCell")}>
        {s.status === "Disputed" && (
          <button
            className={cx("iconBtn", "warn")}
            onClick={() => setDisputeRow(s)}
            title="Xem khiếu nại"
          >
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </button>
        )}

        {canEdit && !locked && (
          <button
            className={cx("iconBtn")}
            onClick={() => setEditingRow(s)}
            title="Quản lý khấu trừ"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
        )}

        {canSend && (
          <button
            className={cx("iconBtn", "send")}
            onClick={() => handleSendOne(s)}
            title="Gửi phiếu lương"
            disabled={actionLoading}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        )}

        {canResend && (
          <button
            className={cx("iconBtn", "send")}
            onClick={() => handleSendOne(s)}
            title="Gửi lại phiếu"
            disabled={actionLoading}
          >
            <FontAwesomeIcon icon={faRotateLeft} />
          </button>
        )}

        {canPay && (
          <button
            className={cx("iconBtn", "pay")}
            onClick={() => setPaymentRow(s)}
            title="Thanh toán"
          >
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </button>
        )}

        <button
          className={cx("iconBtn")}
          onClick={() => setPayslipRow({ ...s, month, year })}
          title="Xem chi tiết"
        >
          <FontAwesomeIcon icon={faEye} />
        </button>

        {locked && <span className={cx("lockIcon")}>🔒</span>}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={cx("page")}>

      {/* ── Header ── */}
      <div className={cx("header")}>
        <div className={cx("headerLeft")}>
          <div className={cx("headerEyebrow")}>Quản lý tài chính nhân sự</div>
          <h1 className={cx("headerTitle")}>Lương &amp; Hoa hồng</h1>
        </div>
        <div className={cx("headerRight")}>
          <div className={cx("monthPicker")}>
            <select
              className={cx("select")} value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className={cx("selectArrow")} />
          </div>
          <div className={cx("monthPicker")}>
            <select
              className={cx("select")} value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className={cx("selectArrow")} />
          </div>
          <button
            className={cx("btn", "btn-ghost")}
            onClick={() => fetchData(month, year)}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faArrowsRotate} spin={loading} /> Làm mới
          </button>
        </div>
      </div>

      {/* ── Source Banner ── */}
      <SourceBanner
        source={dataSource}
        isCurrentMonth={isCurrentMonth}
        canCalculate={canCalculate}
        message={sourceMessage}
      />

      {/* ── Workflow Bar ── */}
      {dataSource === "database" && (
        <div className={cx("workflowBar")}>
          {["Draft", "Pending", "Disputed", "Confirmed", "Paid"].map((s, i) => (
            <React.Fragment key={s}>
              <div className={cx("wfStep", { "wf-active": counts[s] > 0 })}>
                <span className={cx("wfNum")}>{counts[s]}</span>
                <span className={cx("wfLabel")}>{STATUS_META[s]?.label}</span>
              </div>
              {i < 4 && <div className={cx("wfArrow")}>›</div>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Action Bar ── */}
      <div className={cx("actionBar")}>
        <div className={cx("actionGroup")}>
          <button
            className={cx("btn", "btn-draft")}
            onClick={handleCalculateDraft}
            disabled={!canCalculate || actionLoading}
            title={
              isCurrentMonth ? "Không thể tính tháng hiện tại"
              : !canCalculate ? "Tháng này đã tính lương rồi"
              : "Tính lương và lưu bản nháp"
            }
          >
            <FontAwesomeIcon icon={faCalculator} /> Tính lương (Nháp)
          </button>

          <button
            className={cx("btn", "btn-send")}
            onClick={handleSendAll}
            disabled={actionLoading || !counts.Draft}
            title={!counts.Draft ? "Không có phiếu nháp để gửi" : ""}
          >
            <FontAwesomeIcon icon={faPaperPlane} /> Gửi tất cả phiếu
          </button>

          <button
            className={cx("btn", "btn-success")}
            onClick={handleMarkAllPaid}
            disabled={actionLoading || !counts.Confirmed}
            title={!counts.Confirmed ? "Không có phiếu đã xác nhận" : ""}
          >
            <FontAwesomeIcon icon={faMoneyBillWave} /> Đánh dấu Đã TT
          </button>
        </div>

        <div className={cx("searchWrap")}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
          <input
            type="text" className={cx("searchInput")}
            placeholder="Tìm thợ hoặc chi nhánh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {dataSource === "database" && (
        <div className={cx("statGrid")}>
          <StatCard label="Bản nháp"      value={counts.Draft}     sub="Chờ gửi"            variant="draft" />
          <StatCard label="Chờ xác nhận"  value={counts.Pending}   sub="Đang chờ phản hồi"  variant="pending" />
          <StatCard label="Khiếu nại"     value={counts.Disputed}  sub="⚠ Cần xử lý ngay"  variant="disputed" pulse={counts.Disputed > 0} />
          <StatCard label="Đã xác nhận"   value={counts.Confirmed} sub="Sẵn sàng trả lương" variant="confirmed" />
          <StatCard label="Đã thanh toán" value={counts.Paid}      sub="🔒 Đã khóa sổ"     variant="paid" />
        </div>
      )}

      {/* ── Table ── */}
      <div className={cx("tableSection")}>
        <div className={cx("tableHeader")}>
          <h3 className={cx("tableTitle")}>
            Bảng tổng hợp thu nhập tháng {month}/{year}
            {dataSource === "realtime" && (
              <span className={cx("realtimeTag")}>📡 Realtime</span>
            )}
          </h3>
          <p className={cx("tableDesc")}>
            Thực nhận = (Cơ bản + Hoa hồng + Tip + Thưởng) − Khấu trừ
          </p>
        </div>

        {loading ? (
          <div className={cx("loadingState")}>
            <div className={cx("loadingSpinner")} />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <div className={cx("tableWrap")}>
            <table className={cx("table")}>
              <thead>
                <tr>
                  <th>Thợ Barber</th>
                  <th>Doanh thu</th>
                  <th>Thu nhập (+)</th>
                  <th>Khấu trừ (−)</th>
                  <th>Thực nhận</th>
                  <th>Trạng thái</th>
                  <th>Deadline</th>
                  <th className={cx("thRight")}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((s, idx) => {
                    const totalIncome =
                      (s.baseSalary || 0) + (s.commission || 0) +
                      (s.tip || 0) + (s.bonus || 0);
                    const totalDeduct = s.deductions || 0;
                    const net = totalIncome - totalDeduct;

                    return (
                      <tr
                        key={s.idSalary ?? `rt-${s.idBarber}-${idx}`}
                        className={cx({
                          rowDisputed: s.status === "Disputed",
                          rowRealtime: s.status === "Realtime",
                        })}
                      >
                        <td>
                          <div className={cx("empCell")}>
                            <div className={cx("avatar")}>
                              {(s.barberName || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className={cx("empName")}>{s.barberName}</div>
                              <div className={cx("empBranch")}>{s.branchName}</div>
                            </div>
                          </div>
                        </td>
                        <td className={cx("mono", "cMuted")}>{fmt(s.serviceRevenue)}</td>
                        <td className={cx("mono", "cGreen")}>+{fmt(totalIncome)}</td>
                        <td className={cx("mono", "cRed")}>
                          {totalDeduct > 0 ? `−${fmt(totalDeduct)}` : "—"}
                        </td>
                        <td className={cx("mono", "cGold", "fw700")}>{fmt(net)}</td>
                        <td>
                          <Badge status={s.status} />
                          <DisputeTag count={s.disputeCount} />
                        </td>
                        <td>
                          {s.deadlineAt ? (
                            <span className={cx("deadlineTag")}>
                              ⏰ {new Date(s.deadlineAt).toLocaleDateString("vi-VN")}
                            </span>
                          ) : (
                            <span className={cx("cMuted")}>—</span>
                          )}
                        </td>
                        <td>{renderActions(s)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className={cx("emptyRow")}>
                      <div>📭</div>
                      <div>Chưa có dữ liệu bảng lương tháng {month}/{year}</div>
                      {canCalculate && (
                        <div className={cx("emptyHint")}>
                          Bấm "Tính lương (Nháp)" để bắt đầu
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <DeductionModal
        data={editingRow}
        onClose={() => setEditingRow(null)}
        onAdd={handleAddDeduction}
        onRemove={handleRemoveDeduction}
        loading={actionLoading}
        showToast={showToast}
      />
      <DisputeViewModal
        data={disputeRow}
        onClose={() => setDisputeRow(null)}
        onForceClose={handleForceClose}
        onEditAndResend={handleEditAndResend}
        loading={actionLoading}
        showToast={showToast}
      />
      <PayslipModal
        data={payslipRow}
        onClose={() => setPayslipRow(null)}
      />
      <PaymentModal
        data={paymentRow}
        onClose={() => setPaymentRow(null)}
        onConfirm={handlePayment}
        loading={actionLoading}
        showToast={showToast}
      />

      {/* ── Global portals (toast + confirm) ── */}
      <ToastContainer />
      <ConfirmContainer />
    </div>
  );
}

export default LuongThuong;
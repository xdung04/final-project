import React, { useEffect, useState, useCallback } from "react";
import classNames from "classnames/bind";
import styles from "./LuongThuong.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faCalculator, faLock, faEye,
  faPenToSquare, faPaperPlane, faMoneyBillWave,
  faCircleExclamation, faRotateLeft, faXmark,
  faCheckCircle, faTriangleExclamation, faBan,
  faChevronDown, faArrowsRotate
} from "@fortawesome/free-solid-svg-icons";
import { SalaryAPI } from "~/apis/salaryAPI";

const cx = classNames.bind(styles);

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_META = {
  Draft:        { label: "Bản nháp",     cls: "draft",     icon: "📝" },
  Pending:      { label: "Chờ xác nhận", cls: "pending",   icon: "🕐" },
  Disputed:     { label: "Có khiếu nại", cls: "disputed",  icon: "⚠️" },
  Confirmed:    { label: "Đã xác nhận",  cls: "confirmed", icon: "✅" },
  AutoConfirmed:{ label: "Tự xác nhận",  cls: "autoconfirmed", icon: "⏱" },
  Paid:         { label: "Đã thanh toán",cls: "paid",      icon: "💸" },
  Locked:       { label: "Đã khóa",      cls: "locked",    icon: "🔒" },
  Cancelled:    { label: "Đã huỷ",       cls: "cancelled", icon: "🚫" },
};

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";
const calcNet = (s) =>
  (s.baseSalary||0) + (s.commission||0) + (s.tip||0) + (s.bonus||0)
  - (s.advance||0) - (s.deduction||0);

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

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ id, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className={cx("overlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modal")} role="dialog" aria-modal="true">
        <button className={cx("modalClose")} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── Deduction Modal ──────────────────────────────────────────────────────────
function DeductionModal({ data, onClose, onSave, loading }) {
  const [advance, setAdvance]   = useState(data?.advance   || 0);
  const [deduction, setDeduction] = useState(data?.deduction || 0);
  const [note, setNote]         = useState(data?.adjustmentNote || "");

  const handleSave = () => onSave({ idSalary: data.idSalary, advance: Number(advance), deduction: Number(deduction), adjustmentNote: note });

  return (
    <Modal open={!!data} onClose={onClose}>
      <div className={cx("modalTitle")}>✏️ Điều chỉnh khấu trừ</div>
      <div className={cx("modalSub")}>{data?.barberName} &nbsp;·&nbsp; Tháng {data?.month}/{data?.year}</div>

      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Tạm ứng (đ)</label>
        <input type="number" className={cx("formInput")} value={advance} onChange={e => setAdvance(e.target.value)} placeholder="0" min="0" />
      </div>
      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Phạt / Khấu trừ (đ)</label>
        <input type="number" className={cx("formInput")} value={deduction} onChange={e => setDeduction(e.target.value)} placeholder="0" min="0" />
      </div>
      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Ghi chú</label>
        <textarea className={cx("formTextarea")} value={note} onChange={e => setNote(e.target.value)} placeholder="Lý do điều chỉnh..." rows={3} />
      </div>

      <div className={cx("previewBox")}>
        <span>Thực nhận sau điều chỉnh</span>
        <span className={cx("previewVal")}>
          {fmt((data?.baseSalary||0) + (data?.commission||0) + (data?.tip||0) + (data?.bonus||0) - Number(advance) - Number(deduction))}
        </span>
      </div>

      <div className={cx("modalActions")}>
        <button className={cx("btn","btn-ghost")} onClick={onClose}>Huỷ</button>
        <button className={cx("btn","btn-gold")} onClick={handleSave} disabled={loading}>
          {loading ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Dispute View Modal (Admin) ───────────────────────────────────────────────
function DisputeViewModal({ data, onClose, onForceClose, onEditAndResend, loading }) {
  const [reason, setReason] = useState("");
  return (
    <Modal open={!!data} onClose={onClose}>
      <div className={cx("modalTitle")}>⚠️ Xử lý khiếu nại</div>
      <div className={cx("modalSub")}>{data?.barberName} &nbsp;·&nbsp; Tháng {data?.month}/{data?.year}</div>

      <div className={cx("disputeBox")}>
        <div className={cx("disputeBoxLabel")}>Lý do khiếu nại từ thợ</div>
        <div className={cx("disputeBoxText")}>{data?.disputeReason || "—"}</div>
      </div>
      <div className={cx("disputeCountRow")}>
        Số lần khiếu nại: <strong>{data?.disputeCount}/2</strong>
      </div>

      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Lý do từ chối (nếu Force-close)</label>
        <textarea className={cx("formTextarea")} value={reason} onChange={e => setReason(e.target.value)} placeholder="Nhập lý do để đóng khiếu nại..." rows={3} />
      </div>

      <div className={cx("modalActions")}>
        <button className={cx("btn","btn-ghost")} onClick={onClose}>Đóng</button>
        <button className={cx("btn","btn-danger","btn-sm")} onClick={() => onForceClose(reason)} disabled={loading || !reason.trim()}>
          <FontAwesomeIcon icon={faBan} /> Force-close
        </button>
        <button className={cx("btn","btn-send","btn-sm")} onClick={onEditAndResend} disabled={loading}>
          <FontAwesomeIcon icon={faPenToSquare} /> Sửa &amp; Gửi lại
        </button>
      </div>
    </Modal>
  );
}

// ─── Payslip Detail Modal ─────────────────────────────────────────────────────
function PayslipModal({ data, onClose }) {
  if (!data) return null;
  const totalIncome = (data.baseSalary||0) + (data.commission||0) + (data.tip||0) + (data.bonus||0);
  const totalDeduct = (data.advance||0) + (data.deduction||0);
  const net = totalIncome - totalDeduct;

  return (
    <Modal open={!!data} onClose={onClose}>
      <div className={cx("modalTitle")}>👁 Chi tiết phiếu lương</div>
      <div className={cx("modalSub")}>{data.barberName} &nbsp;·&nbsp; Tháng {data.month}/{data.year}</div>

      <div className={cx("breakdownGrid")}>
        {[
          ["Lương cơ bản", data.baseSalary, "plus"],
          ["Hoa hồng 15%", data.commission, "plus"],
          ["Tip", data.tip, "plus"],
          ["Thưởng KPI", data.bonus, "plus"],
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
      <div className={cx("totalRow","minus")}>
        <span>Khấu trừ (tạm ứng + phạt)</span>
        <span className={cx("mono","cRed")}>−{fmt(totalDeduct)}</span>
      </div>
      {data.adjustmentNote && (
        <div className={cx("noteRow")}>📝 {data.adjustmentNote}</div>
      )}
      <div className={cx("totalRow","highlight")}>
        <span>💰 Thực nhận</span>
        <span className={cx("mono","cGold","bigNum")}>{fmt(net)}</span>
      </div>

      <div className={cx("modalActions")}>
        <button className={cx("btn","btn-ghost")} onClick={onClose}>Đóng</button>
      </div>
    </Modal>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ data, onClose, onConfirm, loading }) {
  const [paidAmount, setPaidAmount] = useState(data ? calcNet(data) : 0);
  const [proofUrl, setProofUrl]     = useState("");

  useEffect(() => { if (data) setPaidAmount(calcNet(data)); }, [data]);

  const net = data ? calcNet(data) : 0;
  const isPartial = Number(paidAmount) < net;

  return (
    <Modal open={!!data} onClose={onClose}>
      <div className={cx("modalTitle")}>💸 Xác nhận thanh toán</div>
      <div className={cx("modalSub")}>{data?.barberName} &nbsp;·&nbsp; Thực nhận: <strong>{fmt(net)}</strong></div>

      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Số tiền thanh toán (đ)</label>
        <input type="number" className={cx("formInput")} value={paidAmount} onChange={e => setPaidAmount(e.target.value)} min="0" max={net} />
        {isPartial && <span className={cx("inputHint","warn")}>⚠ Thanh toán một phần — còn lại {fmt(net - Number(paidAmount))}</span>}
      </div>
      <div className={cx("formGroup")}>
        <label className={cx("formLabel")}>Mã / URL bill chuyển khoản</label>
        <input type="text" className={cx("formInput")} value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="VD: FT25091234567" />
      </div>

      <div className={cx("lockWarning")}>
        ⚠ Sau khi xác nhận, phiếu sẽ bị <strong>KHÓA VĨNH VIỄN</strong>. Không thể hoàn tác!
      </div>

      <div className={cx("modalActions")}>
        <button className={cx("btn","btn-ghost")} onClick={onClose}>Huỷ</button>
        <button className={cx("btn","btn-success")} onClick={() => onConfirm({ paidAmount: Number(paidAmount), paymentProofUrl: proofUrl })} disabled={loading || !paidAmount}>
          {loading ? "Đang xử lý..." : "✅ Xác nhận & Khóa sổ"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function LuongThuong() {
  const today = new Date();
  const [month, setMonth]   = useState(today.getMonth() + 1);
  const [year, setYear]     = useState(today.getFullYear());
  const [search, setSearch] = useState("");
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [editingRow,    setEditingRow]    = useState(null); // deduction
  const [disputeRow,    setDisputeRow]    = useState(null); // admin dispute view
  const [payslipRow,    setPayslipRow]    = useState(null); // payslip detail
  const [paymentRow,    setPaymentRow]    = useState(null); // payment confirm

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (m, y) => {
    setLoading(true);
    try {
     const res = await SalaryAPI.getSalaries(m, y);
      const monthData = res.find(item => item.month === m && item.year === y);
      setSalaries(monthData?.salaries || []);
    } catch (err) {
      console.error(err);
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(month, year); }, [month, year, fetchData]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();

  const counts = {
    Draft:     salaries.filter(s => s.status === "Draft").length,
    Pending:   salaries.filter(s => ["Pending","AutoConfirmed"].includes(s.status)).length,
    Disputed:  salaries.filter(s => s.status === "Disputed").length,
    Confirmed: salaries.filter(s => s.status === "Confirmed").length,
    Paid:      salaries.filter(s => ["Paid","Locked"].includes(s.status)).length,
  };

  const filtered = salaries.filter(s =>
    (s.barberName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.branchName || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Action handlers ─────────────────────────────────────────────────────────
  const withLoading = async (fn) => {
    setActionLoading(true);
    try { await fn(); } finally { setActionLoading(false); }
  };

  const handleCalculateDraft = () => withLoading(async () => {
    await SalaryAPI.createDraftSalaries(month, year);
    await fetchData(month, year);
  });

  const handleSendAll = () => {
    if (!window.confirm(`Gửi phiếu lương cho tất cả thợ tháng ${month}/${year}?`)) return;
    withLoading(async () => {
      const drafts = salaries.filter(s => s.status === "Draft");
      await Promise.all(drafts.map(s => SalaryAPI.sendPayslip(s.idSalary)));
      await fetchData(month, year);
    });
  };

  const handleSendOne = (s) => withLoading(async () => {
    await SalaryAPI.sendPayslip(s.idSalary);
    await fetchData(month, year);
  });

  const handleSaveDeduction = (payload) => withLoading(async () => {
    const { idSalary, ...data } = payload;
    
    // Gọi API với 2 tham số riêng biệt
    await SalaryAPI.adjustSalary(idSalary, data);
    setEditingRow(null);
    await fetchData(month, year);
  });

  const handleForceClose = (reason) => withLoading(async () => {
    await SalaryAPI.forceCloseSalaryDispute(disputeRow.idSalary, reason);
    setDisputeRow(null);
    await fetchData(month, year);
  });

  const handleEditAndResend = () => {
    const row = disputeRow;
    setDisputeRow(null);
    setEditingRow(row);
  };

  const handlePayment = (payload) => withLoading(async () => {
    await SalaryAPI.markAsPaid(paymentRow.idSalary, payload);
    setPaymentRow(null);
    await fetchData(month, year);
  });

  const handleMarkAllPaid = () => {
    const confirmed = salaries.filter(s => ["Confirmed","AutoConfirmed"].includes(s.status));
    if (!confirmed.length) { alert("Chưa có thợ nào ở trạng thái Đã xác nhận!"); return; }
    if (!window.confirm(`Đánh dấu đã thanh toán cho ${confirmed.length} thợ?`)) return;
    withLoading(async () => {
      await Promise.all(confirmed.map(s => SalaryAPI.markAsPaid(s.idSalary, { paidAmount: calcNet(s), paymentProofUrl: "" })));
      await fetchData(month, year);
    });
  };

  // ── Render action buttons per row ──────────────────────────────────────────
  const renderActions = (s) => {
    const locked = ["Paid","Locked","Cancelled"].includes(s.status);
    const canEdit = ["Draft","Disputed"].includes(s.status);
    const canSend = s.status === "Draft";
    const canResend = s.status === "Disputed";
    const canPay  = ["Confirmed","AutoConfirmed"].includes(s.status);

    return (
      <div className={cx("actionCell")}>
        {s.status === "Disputed" && (
          <button className={cx("iconBtn","warn")} onClick={() => setDisputeRow(s)} title="Xem khiếu nại">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </button>
        )}
        {canEdit && !locked && (
          <button className={cx("iconBtn")} onClick={() => setEditingRow(s)} title="Điều chỉnh khấu trừ">
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
        )}
        {canSend && (
          <button className={cx("iconBtn","send")} onClick={() => handleSendOne(s)} title="Gửi phiếu lương" disabled={actionLoading}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        )}
        {canResend && (
          <button className={cx("iconBtn","send")} onClick={() => handleSendOne(s)} title="Gửi lại phiếu lương" disabled={actionLoading}>
            <FontAwesomeIcon icon={faRotateLeft} />
          </button>
        )}
        {canPay && (
          <button className={cx("iconBtn","pay")} onClick={() => setPaymentRow(s)} title="Thanh toán">
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </button>
        )}
        <button className={cx("iconBtn")} onClick={() => setPayslipRow({ ...s, month, year })} title="Xem chi tiết">
          <FontAwesomeIcon icon={faEye} />
        </button>
        {locked && <span className={cx("lockIcon")}>🔒</span>}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
            <select className={cx("select")} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className={cx("selectArrow")} />
          </div>
          <div className={cx("monthPicker")}>
            <select className={cx("select")} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className={cx("selectArrow")} />
          </div>
          <button className={cx("btn","btn-ghost")} onClick={() => fetchData(month, year)} disabled={loading}>
            <FontAwesomeIcon icon={faArrowsRotate} spin={loading} /> Làm mới
          </button>
        </div>
      </div>

      {/* ── Workflow Status Bar ── */}
      <div className={cx("workflowBar")}>
        {["Draft","Pending","Disputed","Confirmed","Paid"].map((s, i) => (
          <React.Fragment key={s}>
            <div className={cx("wfStep", { "wf-active": counts[s] > 0 })}>
              <span className={cx("wfNum")}>{counts[s]}</span>
              <span className={cx("wfLabel")}>{STATUS_META[s]?.label}</span>
            </div>
            {i < 4 && <div className={cx("wfArrow")}>›</div>}
          </React.Fragment>
        ))}
      </div>

      {/* ── Action Bar ── */}
      <div className={cx("actionBar")}>
        <div className={cx("actionGroup")}>
          <button
            className={cx("btn","btn-draft")}
            onClick={handleCalculateDraft}
            disabled={isCurrentMonth || actionLoading}
            title={isCurrentMonth ? "Không thể tính lương tháng hiện tại" : ""}
          >
            <FontAwesomeIcon icon={faCalculator} /> Tính lương (Nháp)
          </button>
          <button className={cx("btn","btn-send")} onClick={handleSendAll} disabled={actionLoading || !counts.Draft}>
            <FontAwesomeIcon icon={faPaperPlane} /> Gửi tất cả phiếu
          </button>
          <button className={cx("btn","btn-success")} onClick={handleMarkAllPaid} disabled={actionLoading || !counts.Confirmed}>
            <FontAwesomeIcon icon={faMoneyBillWave} /> Đánh dấu Đã TT
          </button>
        </div>
        <div className={cx("searchWrap")}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
          <input
            type="text"
            className={cx("searchInput")}
            placeholder="Tìm thợ hoặc chi nhánh..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className={cx("statGrid")}>
        <StatCard label="Bản nháp"     value={counts.Draft}     sub="Chờ gửi"           variant="draft" />
        <StatCard label="Chờ xác nhận" value={counts.Pending}   sub="Đang chờ phản hồi" variant="pending" />
        <StatCard label="Khiếu nại"    value={counts.Disputed}  sub="⚠ Cần xử lý ngay" variant="disputed" pulse={counts.Disputed > 0} />
        <StatCard label="Đã xác nhận"  value={counts.Confirmed} sub="Sẵn sàng trả lương" variant="confirmed" />
        <StatCard label="Đã thanh toán" value={counts.Paid}     sub="🔒 Đã khóa sổ"    variant="paid" />
      </div>

      {/* ── Table ── */}
      <div className={cx("tableSection")}>
        <div className={cx("tableHeader")}>
          <h3 className={cx("tableTitle")}>Bảng tổng hợp thu nhập tháng {month}/{year}</h3>
          <p className={cx("tableDesc")}>Thực nhận = (Cơ bản + Hoa hồng + Tip + Thưởng) − (Tạm ứng + Phạt)</p>
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
                {filtered.length > 0 ? filtered.map((s, idx) => {
                  const totalIncome = (s.baseSalary||0) + (s.commission||0) + (s.tip||0) + (s.bonus||0);
                  const totalDeduct = (s.advance||0) + (s.deduction||0);
                  const net = totalIncome - totalDeduct;

                  return (
                    <tr key={s.idSalary || idx} className={cx({ "rowDisputed": s.status === "Disputed" })}>
                      <td>
                        <div className={cx("empCell")}>
                          <div className={cx("avatar")}>{(s.barberName || "U").charAt(0)}</div>
                          <div>
                            <div className={cx("empName")}>{s.barberName}</div>
                            <div className={cx("empBranch")}>{s.branchName}</div>
                          </div>
                        </div>
                      </td>
                      <td className={cx("mono","cMuted")}>{fmt(s.serviceRevenue)}</td>
                      <td className={cx("mono","cGreen")}>+{fmt(totalIncome)}</td>
                      <td className={cx("mono","cRed")}>{totalDeduct > 0 ? `−${fmt(totalDeduct)}` : "—"}</td>
                      <td className={cx("mono","cGold","fw700")}>{fmt(net)}</td>
                      <td>
                        <Badge status={s.status} />
                        <DisputeTag count={s.disputeCount} />
                      </td>
                      <td>
                        {s.deadlineAt
                          ? <span className={cx("deadlineTag")}>⏰ {new Date(s.deadlineAt).toLocaleDateString("vi-VN")}</span>
                          : <span className={cx("cMuted")}>—</span>
                        }
                      </td>
                      <td>{renderActions(s)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" className={cx("emptyRow")}>
                      <div>📭</div>
                      <div>Chưa có dữ liệu bảng lương tháng {month}/{year}</div>
                      {!isCurrentMonth && <div className={cx("emptyHint")}>Bấm "Tính lương (Nháp)" để bắt đầu</div>}
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
        onSave={handleSaveDeduction}
        loading={actionLoading}
      />
      <DisputeViewModal
        data={disputeRow}
        onClose={() => setDisputeRow(null)}
        onForceClose={handleForceClose}
        onEditAndResend={handleEditAndResend}
        loading={actionLoading}
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
      />
    </div>
  );
}

export default LuongThuong;
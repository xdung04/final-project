import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import styles from "../ThoCatToc.module.scss";
import {
  CalendarOff, Plus, Trash2, Edit3, X, Save,
  AlertTriangle, CheckCircle, ChevronRight,
  User, Phone, Calendar, Scissors, Loader,
  MapPin, Search, Filter,
} from "lucide-react";
import { BarberAPI }      from "~/apis/barberAPI";
import { BranchAPI }      from "~/apis/branchAPI";
import { BarberDayOffAPI } from "~/apis/barberDayOffAPI";
import Toast from "~/components/Toast";

const cx = classNames.bind(styles);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate     = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const today       = ()  => new Date().toISOString().split("T")[0];
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

// ── Toast hook ────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const ToastContainer = () =>
    toasts.length > 0
      ? createPortal(
          <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
            {toasts.map((t) => <Toast key={t.id} type={t.type} message={t.message} />)}
          </div>,
          document.body
        )
      : null;
  return { showToast, ToastContainer };
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return createPortal(
    <div className={cx("unavOverlay")} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={cx("unavModalSm")} role="alertdialog">
        <div className={cx("unavModalHead")}>
          <span>{title}</span>
          <button className={cx("unavCloseBtn")} onClick={onCancel}><X size={15} /></button>
        </div>
        <div className={cx("unavModalBody")}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#444" }}>{message}</p>
        </div>
        <div className={cx("unavModalFoot")}>
          <button className={cx("unavBtnGhost")}  onClick={onCancel}><X size={13} /> Hủy</button>
          <button className={cx("unavBtnDanger")} onClick={onConfirm}><Trash2 size={13} /> Xác nhận xóa</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── StepBar ───────────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Nhập thông tin", "Kiểm tra booking", "Xác nhận"];
  return (
    <div className={cx("unavStepBar")}>
      {steps.map((label, i) => {
        const idx     = i + 1;
        const done    = step > idx;
        const current = step === idx;
        return (
          <React.Fragment key={idx}>
            <div className={cx("unavStep", { unavStepDone: done, unavStepActive: current })}>
              <div className={cx("unavStepDot")}>
                {done ? <CheckCircle size={14} /> : <span>{idx}</span>}
              </div>
              <span className={cx("unavStepLabel")}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cx("unavStepLine", { unavStepLineDone: done })} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── DayOff Modal (3 bước) ─────────────────────────────────────────────────────
function DayOffModal({ mode, barbers, branches, initialData, onClose, onSuccess, showToast }) {
  const isEdit = mode === "edit";

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    idBranch:  initialData?.idBranch  || "",
    idBarber:  initialData?.idBarber  || "",
    startDate: initialData?.startDate ? initialData.startDate.substring(0, 10) : "",
    endDate:   initialData?.endDate   ? initialData.endDate.substring(0, 10)   : "",
    reason:    initialData?.reason    || "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filteredBarbers = form.idBranch
    ? barbers.filter((b) => String(b.idBranch) === String(form.idBranch))
    : [];

  const selectedBranch = branches?.find((b) => String(b.idBranch) === String(form.idBranch));
  const selectedBarber = barbers.find((b) => String(b.idBarber) === String(form.idBarber));
  const daysCount      = form.startDate && form.endDate ? daysBetween(form.startDate, form.endDate) : 0;

  // ── Bước 1 → 2 ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    const errs = {};
    if (!form.idBranch)  errs.idBranch  = "Vui lòng chọn chi nhánh";
    if (!form.idBarber)  errs.idBarber  = "Vui lòng chọn thợ";
    if (!form.startDate) errs.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!form.endDate)   errs.endDate   = "Vui lòng chọn ngày kết thúc";
    if (form.startDate && form.startDate < today() && !isEdit)
      errs.startDate = "Ngày bắt đầu phải từ hôm nay trở đi";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      errs.endDate = "Ngày kết thúc phải >= ngày bắt đầu";

    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await BarberDayOffAPI.preview({
        idBarber:  form.idBarber,
        startDate: form.startDate,
        endDate:   form.endDate,
        excludeId: initialData?.idUnavailable || null,
      });
      setPreview(res?.data || res);
      setStep(2);
    } catch (err) {
      showToast("error", err?.message || "Lỗi kiểm tra lịch");
    } finally {
      setLoading(false);
    }
  };

  // ── Bước 3: Lưu ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);
    try {
      if (isEdit) {
        await BarberDayOffAPI.update(initialData.idUnavailable, form);
        showToast("success", "Cập nhật lịch nghỉ thành công!");
      } else {
        await BarberDayOffAPI.create(form);
        showToast("success", "Đã thêm lịch nghỉ và hủy booking liên quan!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast("error", err?.message || "Lỗi lưu lịch nghỉ");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={cx("unavOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("unavModal")} role="dialog" aria-modal="true">

        {/* Header */}
        <div className={cx("unavModalHead")}>
          <div>
            <div className={cx("unavModalTitle")}>{isEdit ? "Sửa lịch nghỉ" : "Thêm lịch nghỉ"}</div>
            {selectedBranch && selectedBarber && (
              <div className={cx("unavModalSub")}>{selectedBranch.name} • {selectedBarber.fullName}</div>
            )}
          </div>
          <button className={cx("unavCloseBtn")} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step bar */}
        <div className={cx("unavStepWrap")}><StepBar step={step} /></div>

        {/* Body */}
        <div className={cx("unavModalBody")}>

          {/* Bước 1 */}
          {step === 1 && (
            <div className={cx("unavFormGrid")}>

              <div className={cx("unavField", "unavFieldFull")}>
                <label className={cx("unavLabel")}>Chi nhánh <span className={cx("unavRequired")}>*</span></label>
                <select
                  className={cx("unavInput", { unavInputError: errors.idBranch })}
                  value={form.idBranch}
                  onChange={(e) => { set("idBranch", e.target.value); set("idBarber", ""); }}
                  disabled={isEdit}
                >
                  <option value="">— Chọn chi nhánh —</option>
                  {branches?.map((b) => (
                    <option key={b.idBranch} value={b.idBranch}>{b.name}</option>
                  ))}
                </select>
                {errors.idBranch && <span className={cx("unavErrMsg")}>{errors.idBranch}</span>}
              </div>

              <div className={cx("unavField", "unavFieldFull")}>
                <label className={cx("unavLabel")}>Thợ cắt tóc <span className={cx("unavRequired")}>*</span></label>
                <select
                  className={cx("unavInput", { unavInputError: errors.idBarber })}
                  value={form.idBarber}
                  onChange={(e) => set("idBarber", e.target.value)}
                  disabled={isEdit || !form.idBranch}
                >
                  <option value="">{form.idBranch ? "— Chọn thợ —" : "— Chọn chi nhánh trước —"}</option>
                  {filteredBarbers.map((b) => (
                    <option key={b.idBarber} value={b.idBarber}>{b.fullName}</option>
                  ))}
                </select>
                {errors.idBarber && <span className={cx("unavErrMsg")}>{errors.idBarber}</span>}
              </div>

              <div className={cx("unavField")}>
                <label className={cx("unavLabel")}>Ngày bắt đầu <span className={cx("unavRequired")}>*</span></label>
                <input
                  className={cx("unavInput", { unavInputError: errors.startDate })}
                  type="date"
                  min={isEdit ? undefined : today()}
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
                {errors.startDate && <span className={cx("unavErrMsg")}>{errors.startDate}</span>}
              </div>

              <div className={cx("unavField")}>
                <div className={cx("unavLabelRow")}>
                  <label className={cx("unavLabel")}>Ngày kết thúc <span className={cx("unavRequired")}>*</span></label>
                  <span className={cx("unavLabelHint")}>(bằng ngày bắt đầu = nghỉ 1 ngày)</span>
                </div>
                <input
                  className={cx("unavInput", { unavInputError: errors.endDate })}
                  type="date"
                  min={form.startDate || today()}
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
                {errors.endDate && <span className={cx("unavErrMsg")}>{errors.endDate}</span>}
              </div>

              {daysCount > 0 && (
                <div className={cx("unavDayCount", "unavFieldFull")}>
                  <Calendar size={13} />
                  Tổng <strong>{daysCount} ngày</strong> nghỉ{daysCount === 1 ? " (nghỉ 1 ngày)" : ""}
                </div>
              )}

              <div className={cx("unavField", "unavFieldFull")}>
                <label className={cx("unavLabel")}>Lý do nghỉ</label>
                <textarea
                  className={cx("unavInput", "unavTextarea")}
                  placeholder="VD: Nghỉ phép, việc cá nhân, ốm..."
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Bước 2 */}
          {step === 2 && preview && (
            <div className={cx("unavPreview")}>
              <div className={cx("unavPreviewInfo")}>
                <div className={cx("unavPreviewRow")}><User size={13} /><span>{selectedBarber?.fullName}</span></div>
                <div className={cx("unavPreviewRow")}>
                  <Calendar size={13} />
                  <span>{fmtDate(form.startDate)} → {fmtDate(form.endDate)}</span>
                  <span className={cx("unavPreviewDays")}>{daysCount} ngày</span>
                </div>
                {form.reason && (
                  <div className={cx("unavPreviewRow")}><CalendarOff size={13} /><span>{form.reason}</span></div>
                )}
              </div>

              {preview.affectedCount === 0 ? (
                <div className={cx("unavNoBooking")}>
                  <CheckCircle size={18} />
                  <div>
                    <strong>Không có booking bị ảnh hưởng</strong>
                    <p>Khoảng thời gian này thợ chưa có lịch hẹn nào.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className={cx("unavWarnBanner")}>
                    <AlertTriangle size={15} />
                    <span>
                      Có <strong>{preview.affectedCount} booking</strong> sẽ bị hủy.
                      Hệ thống sẽ tự động thông báo đến khách và lễ tân chi nhánh.
                    </span>
                  </div>
                  <div className={cx("unavBookingTable")}>
                    <table>
                      <thead>
                        <tr>
                          <th><Calendar size={11} /> Ngày hẹn</th>
                          <th><User size={11} /> Khách hàng</th>
                          <th><Phone size={11} /> SĐT</th>
                          <th><Scissors size={11} /> Dịch vụ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.bookings?.map((b) => (
                          <tr key={b.idBooking}>
                            <td>{fmtDate(b.bookingDate)}</td>
                            <td>{b.customer?.fullName    || "—"}</td>
                            <td>{b.customer?.phoneNumber || "—"}</td>
                            <td className={cx("unavServiceCell")}>
                              {b.services?.map((s) => s.name).join(", ") || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bước 3 */}
          {step === 3 && (
            <div className={cx("unavConfirmBox")}>
              <div className={cx("unavConfirmIcon")}><CalendarOff size={28} /></div>
              <div className={cx("unavConfirmTitle")}>Xác nhận lưu lịch nghỉ?</div>
              <div className={cx("unavConfirmRows")}>
                <div className={cx("unavConfirmRow")}>
                  <span>Thợ</span>
                  <strong>{selectedBarber?.fullName}</strong>
                </div>
                <div className={cx("unavConfirmRow")}>
                  <span>Thời gian</span>
                  <strong>{fmtDate(form.startDate)} — {fmtDate(form.endDate)} ({daysCount} ngày)</strong>
                </div>
                {form.reason && (
                  <div className={cx("unavConfirmRow")}><span>Lý do</span><strong>{form.reason}</strong></div>
                )}
                <div className={cx("unavConfirmRow")}>
                  <span>Booking bị hủy</span>
                  <strong className={cx(preview?.affectedCount > 0 ? "unavRed" : "unavGreen")}>
                    {preview?.affectedCount > 0
                      ? `${preview.affectedCount} booking — khách & lễ tân sẽ được thông báo`
                      : "Không có"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cx("unavModalFoot")}>
          {step === 1 && (
            <>
              <button className={cx("unavBtnGhost")} onClick={onClose}><X size={13} /> Hủy</button>
              <button className={cx("unavBtnPrimary")} onClick={handleNext} disabled={loading}>
                {loading
                  ? <Loader size={13} className={cx("unavSpin")} />
                  : <ChevronRight size={13} />}
                Kiểm tra booking
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button className={cx("unavBtnGhost")} onClick={() => setStep(1)}>← Quay lại</button>
              <button className={cx("unavBtnPrimary")} onClick={() => setStep(3)}>
                {preview?.affectedCount > 0
                  ? `Tiếp tục — hủy ${preview.affectedCount} booking`
                  : "Tiếp tục xác nhận"}
                <ChevronRight size={13} />
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button className={cx("unavBtnGhost")} onClick={() => setStep(2)}>← Quay lại</button>
              <button className={cx("unavBtnPrimary")} onClick={handleSave} disabled={loading}>
                {loading
                  ? <><Loader size={13} className={cx("unavSpin")} /> Đang lưu...</>
                  : <><Save size={13} /> Xác nhận lưu</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function DayOffRow({ record, onEdit, onDelete }) {
  const isOngoing = record.startDate <= today() && today() <= record.endDate;
  const isPast    = record.endDate < today();
  const statusLabel = isPast ? "Đã qua" : isOngoing ? "Đang nghỉ" : "Sắp tới";
  const statusCls   = isPast ? "unavTagPast" : isOngoing ? "unavTagOngoing" : "unavTagFuture";
  const days        = daysBetween(record.startDate, record.endDate);

  return (
    <tr className={cx("unavRow", { unavRowPast: isPast })}>
      <td>
        <div className={cx("unavBarberCell")}>
          <div className={cx("unavAvatar")}>{record.barberName?.[0] || "?"}</div>
          <div>
            <div className={cx("unavBarberName")}>{record.barberName}</div>
            <div className={cx("unavBarberBranch")}><MapPin size={10} /> {record.branchName || "—"}</div>
          </div>
        </div>
      </td>
      <td>
        <div className={cx("unavDateRange")}>
          <span>{fmtDate(record.startDate)}</span>
          {record.startDate !== record.endDate && (
            <><span className={cx("unavDateArrow")}>→</span><span>{fmtDate(record.endDate)}</span></>
          )}
        </div>
        <div className={cx("unavDayBadge")}>{days} ngày</div>
      </td>
      <td><span className={cx("unavTag", statusCls)}>{statusLabel}</span></td>
      <td className={cx("unavReasonCell")}>{record.reason || <span className={cx("unavMuted")}>—</span>}</td>
      <td>
        <div className={cx("unavActions")}>
          {!isPast && (
            <>
              <button className={cx("unavActionBtn", "unavActionEdit")} onClick={() => onEdit(record)}><Edit3 size={13} /></button>
              <button className={cx("unavActionBtn", "unavActionDel")}  onClick={() => onDelete(record)}><Trash2 size={13} /></button>
            </>
          )}
          {isPast && <span className={cx("unavMuted", "unavSmall")}>Đã khóa</span>}
        </div>
      </td>
    </tr>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
function DayOffTab() {
  const [records,    setRecords]    = useState([]);
  const [barbers,    setBarbers]    = useState([]);
  const [branches,   setBranches]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal,      setModal]      = useState(null);
  const [delItem,    setDelItem]    = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const { showToast, ToastContainer } = useToast();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dayOffRes, barberList, branchList] = await Promise.all([
        BarberDayOffAPI.getAll(),
        BarberAPI.getAll(),
        BranchAPI.getAll(),
      ]);

      // Records
      const recs = dayOffRes?.data || dayOffRes || [];
      setRecords(Array.isArray(recs) ? recs : []);

      // Barbers
      setBarbers(
        Array.isArray(barberList)          ? barberList :
        Array.isArray(barberList?.barbers) ? barberList.barbers :
        Array.isArray(barberList?.data)    ? barberList.data : []
      );

      // Branches
      setBreaches(
        Array.isArray(branchList)       ? branchList :
        Array.isArray(branchList?.data) ? branchList.data : []
      );
    } catch (err) {
      console.error("fetchAll lỗi:", err);
      showToast("error", "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Typo fix helper (setBranches bị gọi sai tên ở trên)
  const setBreaches = setBranches;

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Xóa ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!delItem) return;
    setDelLoading(true);
    try {
      await BarberDayOffAPI.delete(delItem.idUnavailable);
      showToast("success", "Đã xóa lịch nghỉ. Slot đã được mở lại.");
      setDelItem(null);
      fetchAll();
    } catch (err) {
      showToast("error", err?.message || "Không thể xóa");
    } finally {
      setDelLoading(false);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = records.filter((r) => {
    const matchName   = r.barberName?.toLowerCase().includes(search.toLowerCase());
    const matchBranch = filterBranch ? String(r.idBranch) === filterBranch : true;
    const isPast      = r.endDate < today();
    const isOngoing   = r.startDate <= today() && today() <= r.endDate;
    const matchStatus = !filterStatus
      || (filterStatus === "past"    && isPast)
      || (filterStatus === "ongoing" && isOngoing)
      || (filterStatus === "future"  && !isPast && !isOngoing);
    return matchName && matchBranch && matchStatus;
  });

  const stats = {
    total:   records.length,
    ongoing: records.filter((r) => r.startDate <= today() && today() <= r.endDate).length,
    future:  records.filter((r) => r.startDate > today()).length,
  };

  const branchesForFilter = [
    ...new Map(
      barbers.filter((b) => b.idBranch)
             .map((b) => [b.idBranch, { id: b.idBranch, name: b.branchName }])
    ).values()
  ];

  return (
    <div className={cx("container")}>

      {/* Header */}
      <div className={cx("headerArea")}>
        <div className={cx("titleBox")}>
          <CalendarOff size={24} strokeWidth={1.5} className={cx("titleIcon")} />
          <div>
            <h2>Lịch nghỉ <em>Thợ cắt tóc</em></h2>
            <p className={cx("titleMeta")}>
              {stats.total} lịch nghỉ · {stats.ongoing} đang nghỉ · {stats.future} sắp tới
            </p>
          </div>
        </div>
        <button className={cx("addBtn")} onClick={() => setModal({ mode: "create" })}>
          <Plus size={15} strokeWidth={2.5} /> Thêm lịch nghỉ
        </button>
      </div>

      {/* Filter bar */}
      <div className={cx("unavFilterBar")}>
        <div className={cx("unavFilterSearch")}>
          <Search size={13} />
          <input placeholder="Tìm tên thợ..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className={cx("unavFilterSelect")}>
          <Filter size={13} />
          <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
            <option value="">Tất cả chi nhánh</option>
            {branchesForFilter.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className={cx("unavFilterSelect")}>
          <CalendarOff size={13} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="future">Sắp tới</option>
            <option value="ongoing">Đang nghỉ</option>
            <option value="past">Đã qua</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={cx("unavTableWrap")}>
        {loading ? (
          <div className={cx("unavLoading")}>
            <Loader size={20} className={cx("unavSpin")} /><span>Đang tải...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={cx("unavEmpty")}>
            <CalendarOff size={36} strokeWidth={1} />
            <p>Chưa có lịch nghỉ nào</p>
            <button className={cx("addBtn")} onClick={() => setModal({ mode: "create" })}>
              <Plus size={14} /> Thêm lịch nghỉ đầu tiên
            </button>
          </div>
        ) : (
          <table className={cx("unavTable")}>
            <thead>
              <tr>
                <th>Thợ</th><th>Thời gian nghỉ</th><th>Trạng thái</th><th>Lý do</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <DayOffRow
                  key={r.idUnavailable}
                  record={r}
                  onEdit={(rec) => setModal({ mode: "edit", data: rec })}
                  onDelete={(rec) => setDelItem(rec)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <DayOffModal
          mode={modal.mode}
          barbers={barbers}
          branches={branches}
          initialData={modal.data || null}
          onClose={() => setModal(null)}
          onSuccess={fetchAll}
          showToast={showToast}
        />
      )}

      <ConfirmModal
        open={!!delItem}
        title="Xóa lịch nghỉ"
        message={
          delItem
            ? `Xác nhận xóa lịch nghỉ của ${delItem.barberName} từ ${fmtDate(delItem.startDate)} đến ${fmtDate(delItem.endDate)}? Slot sẽ được mở lại nhưng booking đã hủy trước đó không được khôi phục.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDelItem(null)}
      />

      <ToastContainer />
    </div>
  );
}

export default DayOffTab;
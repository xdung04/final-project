import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "../ChinhSach.module.scss";
import {
  FileText, Edit3, CheckCircle, AlertTriangle,
  Save, X, RefreshCw, UserMinus, Calendar,
  Trophy, Plus, Trash2
} from "lucide-react";
import { HrPolicyAPI } from "~/apis/hrPolicyAPI";

const cx = classNames.bind(styles);

// Thay thế đoạn code Helper cũ bằng đoạn này:

const fmt     = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

// Lấy ngày hôm nay chuẩn Local Time (tránh lỗi lệch ngày vào buổi sáng)
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Lấy Mùng 1 tháng sau chuẩn Local Time
const getFirstDayNextMonth = () => {
  const d = new Date();
  let nextMonth = d.getMonth() + 2; // +1 ra tháng sau, +1 nữa vì hệ thống tính tháng từ 0
  let year = d.getFullYear();

  if (nextMonth > 12) {
    nextMonth = 1;
    year += 1;
  }
  return `${year}-${String(nextMonth).padStart(2, '0')}-01`;
};

// Cắt chuỗi an toàn (lấy đúng YYYY-MM-DD từ DB)
const safeFormatDate = (dateStr) => {
  if (!dateStr) return "";
  return dateStr.substring(0, 10); 
};

// ═══════════════════════════════════════════════════════════════════
// HELPER: Phân tích trạng thái HĐ
// ═══════════════════════════════════════════════════════════════════
const getContractState = (barber) => {
  const today = getTodayStr();
  if (!barber.idSalaryContract)                                         return "none";
  if (barber.contractStatus === "closed")                               return "closed";
  if (barber.contractStatus === "terminated")                           return "terminated";
  if (barber.startDate > today)                                         return "pending";
  if (barber.startDate <= today && !barber.endDate)                     return "active";
  if (barber.startDate <= today && barber.endDate >= today)             return "active_with_end";
  return "none";
};

// ═══════════════════════════════════════════════════════════════════
// PROMOTION ALERT BANNER
// ═══════════════════════════════════════════════════════════════════
function PromotionAlert({ promotionList, onPromote }) {
  if (!promotionList?.length) return null;
  return (
    <div className={cx("promotionAlertBox")}>
      {promotionList.map((item) => (
        <div key={item.idBarber} className={cx("promotionAlertItem")}>
          <Trophy size={14} />
          <span>
            <strong>{item.barberName}</strong> đủ điều kiện lên{" "}
            <strong>{item.nextPlanName}</strong>
          </span>
          <button
            className={cx("btn", "small", "gold")}
            onClick={() => onPromote(item)}
          >
            Lên cấp
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BARBER CONTRACT ROW
// ═══════════════════════════════════════════════════════════════════
function BarberContractRow({ barber, plans, onAction }) {
  const state       = getContractState(barber);
  const currentPlan = plans.find(
    (p) => p.idCompensationPlan === barber.idCompensationPlan
  );

  const statusLabel = {
    none:           <span className={cx("contractStatus", "inactive")}>Chưa có HĐ</span>,
    pending:        <span className={cx("contractStatus", "pending")}>⏳ Chờ hiệu lực</span>,
    active:         <span className={cx("contractStatus", "active")}>✅ Đang hoạt động</span>,
    active_with_end:<span className={cx("contractStatus", "active")}>✅ Có ngày kết thúc</span>,
    closed:         <span className={cx("contractStatus", "closed")}>📋 Đã đóng</span>,
    terminated:     <span className={cx("contractStatus", "terminated")}>❌ Kết thúc</span>,
  }[state];

  return (
    <tr className={cx("contractRow")}>
      <td>
        <div className={cx("barberCell")}>
          <div className={cx("barberAvatar")}>{barber.avatar}</div>
          <div>
            <div className={cx("barberName")}>{barber.name}</div>
            <div className={cx("barberBranch")}>{barber.branch}</div>
          </div>
        </div>
      </td>
      <td>
        {currentPlan
          ? <span className={cx("planPill")}>{currentPlan.displayName}</span>
          : <span className={cx("noPlan")}>Chưa gắn cấp</span>}
      </td>
      <td>
        {barber.actualBaseSalary ? (
          <div className={cx("salaryCell")}>
            <span className={cx("salaryVal")}>{fmt(barber.actualBaseSalary)}đ</span>
            {currentPlan &&
              Number(barber.actualBaseSalary) !== Number(currentPlan.defaultBaseSalary) && (
              <span className={cx("salaryCustomTag")}>Custom</span>
            )}
          </div>
        ) : "—"}
      </td>
      <td>{fmtDate(barber.startDate)}</td>
      <td>{barber.endDate ? fmtDate(barber.endDate) : "—"}</td>
      <td>{statusLabel}</td>
      <td>
        <div className={cx("actionGroup")}>
          {/* Chưa có HĐ */}
          {state === "none" && (
            <button className={cx("btn", "small", "primary")}
              onClick={() => onAction("create", barber)}>
              <Edit3 size={13} /> Ký HĐ
            </button>
          )}

          {/* Chờ hiệu lực */}
          {state === "pending" && (
            <>
              <button className={cx("btn", "small", "warning")}
                onClick={() => onAction("edit_pending", barber)}>
                <Edit3 size={13} /> Sửa
              </button>
              <button className={cx("btn", "small", "danger")}
                onClick={() => onAction("cancel_pending", barber)}>
                <X size={13} /> Hủy HĐ
              </button>
            </>
          )}

          {/* Đang hoạt động — chưa có endDate */}
          {state === "active" && (
            <button className={cx("btn", "small", "warning")}
              onClick={() => onAction("set_end_date", barber)}>
              <Calendar size={13} /> Thiết lập ngày nghỉ
            </button>
          )}

          {/* Đang hoạt động — đã có endDate */}
          {state === "active_with_end" && (
            <>
              <button className={cx("btn", "small", "danger")}
                onClick={() => onAction("settle", barber)}>
                <UserMinus size={13} /> Quyết toán
              </button>
              <button className={cx("btn", "small", "ghost")}
                onClick={() => onAction("cancel_end_date", barber)}>
                <X size={13} /> Hủy ngày nghỉ
              </button>
            </>
          )}

          {/* Đã đóng / Kết thúc — không có nút */}
        </div>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONTRACT MODAL — Ký mới / Sửa pending
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// CONTRACT MODAL — Ký mới / Sửa pending
// ═══════════════════════════════════════════════════════════════════
function ContractModal({ mode, barber, plans, onSave, onClose }) {
  const [form, setForm] = useState({
    idCompensationPlan: barber.idCompensationPlan || plans[0]?.idCompensationPlan || "",
    actualBaseSalary:   barber.actualBaseSalary   || plans[0]?.defaultBaseSalary  || 0,
    
    // FIX: Phân biệt rõ lúc Sửa (edit_pending) và Tạo mới (create)
    startDate: mode === "edit_pending" 
      ? safeFormatDate(barber.startDate) 
      : getFirstDayNextMonth(),
  });

  const selectedPlan = plans.find(
    (p) => p.idCompensationPlan === Number(form.idCompensationPlan)
  );

  const handlePlanChange = (pid) => {
    const plan = plans.find((p) => p.idCompensationPlan === Number(pid));
    setForm((f) => ({
      ...f,
      idCompensationPlan: Number(pid),
      actualBaseSalary:   plan?.defaultBaseSalary || f.actualBaseSalary,
    }));
  };

  // ... (Phần return giao diện giữ nguyên không cần thay đổi gì)

  return (
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox")}>
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>
              {mode === "create" ? "Ký hợp đồng mới" : "Sửa hợp đồng chờ hiệu lực"}
            </div>
            <div className={cx("modalSubtitle")}>{barber.name}</div>
          </div>
          <button className={cx("modalCloseBtn")} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={cx("modalBody")}>
          <div className={cx("formGrid")}>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Cấp bậc <span className={cx("required")}>*</span></label>
              <select className={cx("input", "select")} value={form.idCompensationPlan}
                onChange={(e) => handlePlanChange(e.target.value)}>
                <option value="">-- Chọn cấp bậc --</option>
                {plans.map((p) => (
                  <option key={p.idCompensationPlan} value={p.idCompensationPlan}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Lương cứng thực tế (đ)</label>
              <input className={cx("input")} type="number"
                value={form.actualBaseSalary}
                onChange={(e) => setForm(f => ({ ...f, actualBaseSalary: Number(e.target.value) }))} />
              {selectedPlan && (
                <span className={cx("fieldHint")}>
                  Mặc định: {fmt(selectedPlan.defaultBaseSalary)}đ
                </span>
              )}
            </div>

            {/* startDate readonly — tự động mùng 1 tháng sau */}
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Ngày bắt đầu</label>
              <input className={cx("input")} type="date"
                value={form.startDate} readOnly disabled />
              <span className={cx("fieldHint")}>Tự động: Mùng 1 tháng sau</span>
            </div>
          </div>

          {selectedPlan &&
            Number(form.actualBaseSalary) !== Number(selectedPlan.defaultBaseSalary) && (
            <div className={cx("customSalaryNote")}>
              <AlertTriangle size={13} />
              Lương thực tế khác mức mặc định ({fmt(selectedPlan.defaultBaseSalary)}đ).
            </div>
          )}
        </div>

        <div className={cx("modalFooter")}>
          <button className={cx("btn", "ghost")} onClick={onClose}>
            <X size={14} /> Huỷ
          </button>
          <button className={cx("btn", "primary")} onClick={() => onSave(mode, form)}>
            <Save size={14} /> Lưu hợp đồng
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// END DATE MODAL — Preview booking bị hủy + xác nhận
// ═══════════════════════════════════════════════════════════════════
function EndDateModal({ barber, onConfirm, onClose }) {
  const [endDate,  setEndDate]  = useState("");
  const [preview,  setPreview]  = useState(null);  // { affectedCount, affectedBookings }
  const [loading,  setLoading]  = useState(false);
  const [previewed, setPreviewed] = useState(false);

  // Cảnh báo < 14 ngày
  const daysDiff = endDate
    ? Math.floor((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isShortNotice = daysDiff !== null && daysDiff < 14;

  const handlePreview = async () => {
    if (!endDate) return;
    setLoading(true);
    try {
      const res = await HrPolicyAPI.previewEndDate(barber.idSalaryContract, endDate);
      setPreview(res.data);
      setPreviewed(true);
    } catch (err) {
      alert("Lỗi preview: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox")}>
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>Thiết lập ngày nghỉ việc</div>
            <div className={cx("modalSubtitle")}>{barber.name}</div>
          </div>
          <button className={cx("modalCloseBtn")} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={cx("modalBody")}>
          <div className={cx("field")}>
            <label className={cx("fieldLabel")}>Ngày làm việc cuối <span className={cx("required")}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className={cx("input")} type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPreviewed(false); setPreview(null); }} />
              <button className={cx("btn", "outline")} onClick={handlePreview} disabled={!endDate || loading}>
                {loading ? "Đang kiểm tra..." : "Kiểm tra booking"}
              </button>
            </div>
          </div>

          {/* Cảnh báo < 14 ngày */}
          {isShortNotice && (
            <div className={cx("warnNote")}>
              <AlertTriangle size={13} />
              ⚠️ Thợ báo nghỉ chưa đủ 14 ngày, vui lòng cân nhắc mức khấu trừ phạt vi phạm.
            </div>
          )}

          {/* Danh sách booking bị ảnh hưởng */}
          {previewed && preview && (
            <div className={cx("previewBox")}>
              {preview.affectedCount === 0 ? (
                <div className={cx("previewEmpty")}>
                  ✅ Không có booking nào bị ảnh hưởng.
                </div>
              ) : (
                <>
                  <div className={cx("previewTitle")}>
                    Các booking sau ngày {fmtDate(endDate)} sẽ bị hủy ({preview.affectedCount} booking):
                  </div>
                  <table className={cx("previewTable")}>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Khách hàng</th>
                        <th>SĐT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.affectedBookings.map((b) => (
                        <tr key={b.idBooking}>
                          <td>{fmtDate(b.bookingDate)}</td>
                          <td>{b.customer?.fullName || "—"}</td>
                          <td>{b.customer?.phoneNumber || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>

        <div className={cx("modalFooter")}>
          <button className={cx("btn", "ghost")} onClick={onClose}>
            <X size={14} /> Hủy bỏ
          </button>
          <button className={cx("btn", "danger")}
            disabled={!previewed}
            onClick={() => onConfirm(barber.idSalaryContract, endDate)}>
            <Calendar size={14} />
            {preview?.affectedCount > 0
              ? `Xác nhận & Hủy ${preview.affectedCount} booking`
              : "Xác nhận thiết lập"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROMOTE MODAL — Xác nhận lên cấp
// ═══════════════════════════════════════════════════════════════════
function PromoteModal({ promotionItem, plans, salaryPeriod, onConfirm, onClose }) {
  const nextPlan = plans.find(
    (p) => p.idCompensationPlan === promotionItem.idNextPlan
  );

  const [actualBaseSalary, setActualBaseSalary] = useState(
    nextPlan?.defaultBaseSalary || 0
  );

  return (
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox")}>
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>Xác nhận lên cấp</div>
            <div className={cx("modalSubtitle")}>{promotionItem.barberName}</div>
          </div>
          <button className={cx("modalCloseBtn")} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={cx("modalBody")}>
          <div className={cx("promoteInfoBox")}>
            <div className={cx("promoteRow")}>
              <span>Cấp hiện tại:</span>
              <strong>{promotionItem.currentPlanName}</strong>
            </div>
            <div className={cx("promoteRow")}>
              <span>Lên cấp:</span>
              <strong className={cx("goldText")}>{promotionItem.nextPlanName}</strong>
            </div>
            <div className={cx("promoteRow")}>
              <span>HĐ cũ kết thúc:</span>
              <strong>31/{salaryPeriod.month}/{salaryPeriod.year}</strong>
            </div>
            <div className={cx("promoteRow")}>
              <span>HĐ mới bắt đầu:</span>
              <strong>01/{salaryPeriod.month + 1}/{salaryPeriod.year}</strong>
            </div>
          </div>

          <div className={cx("field")} style={{ marginTop: 16 }}>
            <label className={cx("fieldLabel")}>Lương cứng mới (đ)</label>
            <input className={cx("input")} type="number"
              value={actualBaseSalary}
              onChange={(e) => setActualBaseSalary(Number(e.target.value))} />
            {nextPlan && (
              <span className={cx("fieldHint")}>
                Mặc định: {fmt(nextPlan.defaultBaseSalary)}đ
              </span>
            )}
          </div>
        </div>

        <div className={cx("modalFooter")}>
          <button className={cx("btn", "ghost")} onClick={onClose}>
            <X size={14} /> Hủy
          </button>
          <button className={cx("btn", "gold")}
            onClick={() => onConfirm({
              idContract:         promotionItem.idContract,
              idCompensationPlan: promotionItem.idNextPlan,
              actualBaseSalary,
              salaryPeriod,
            })}>
            <Trophy size={14} /> Xác nhận lên cấp
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SETTLEMENT MODAL — Quyết toán
// ═══════════════════════════════════════════════════════════════════
// Thay thế SettlementModal trong ContractsTab.jsx

function SettlementModal({ barber, onConfirm, onClose }) {
  const [preview,    setPreview]    = useState(null);   // dữ liệu từ API
  const [loading,    setLoading]    = useState(true);
  const [deductions, setDeductions] = useState([]);

  // Load preview khi mở modal
  useEffect(() => {
    const load = async () => {
      try {
        const res = await HrPolicyAPI.previewSettlement(barber.idSalaryContract);
        setPreview(res.data || res);
      } catch (err) {
        alert("Lỗi tải dữ liệu quyết toán: " + (err.message || ""));
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [barber.idSalaryContract]);

  // Tính realtime
  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const netSalary       = (preview?.totalSalary || 0) - totalDeductions;

  const addDeduction = () => {
    setDeductions((d) => [...d, { amount: "", reason: "", violationDate: "" }]);
  };

  const updateDeduction = (idx, key, val) => {
    setDeductions((d) => d.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };

  const removeDeduction = (idx) => {
    setDeductions((d) => d.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    // Validate deductions
    const invalid = deductions.find((d) => !d.amount || !d.reason || !d.violationDate);
    if (invalid) {
      alert("Vui lòng điền đầy đủ ngày vi phạm, số tiền và lý do cho tất cả khoản khấu trừ.");
      return;
    }
    onConfirm(barber.idSalaryContract, deductions);
  };

  return (
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox", "modalBoxWide")}>

        {/* Header */}
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>Quyết toán & Chấm dứt HĐ</div>
            <div className={cx("modalSubtitle")}>{barber.name}</div>
          </div>
          <button className={cx("modalCloseBtn")} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={cx("modalBody")}>
          {loading ? (
            <div className={cx("settlementLoading")}>
              <Loader size={18} className={cx("spin")} />
              <span>Đang tính toán...</span>
            </div>
          ) : preview && (
            <>
              {/* ── Thu nhập ── */}
              <div className={cx("settlementSection")}>
                <div className={cx("settlementSectionTitle")}>Thu nhập</div>

                <div className={cx("settlementRows")}>
                  <div className={cx("settlementRow")}>
                    <span>Lương cứng</span>
                    <div className={cx("settlementRowRight")}>
                      <span className={cx("settlementFormula")}>
                        ({fmt(preview.baseSalaryFull)}đ / {preview.daysInMonth} ngày) × {preview.daysWorked} ngày
                      </span>
                      <span className={cx("settlementVal")}>{fmt(preview.baseSalary)}đ</span>
                    </div>
                  </div>

                  <div className={cx("settlementRow")}>
                    <span>Hoa hồng</span>
                    <span className={cx("settlementVal")}>{fmt(preview.commission)}đ</span>
                  </div>

                  <div className={cx("settlementRow")}>
                    <span>Tips</span>
                    <span className={cx("settlementVal")}>{fmt(preview.tips)}đ</span>
                  </div>

                  {preview.bonus > 0 && (
                    <div className={cx("settlementRow")}>
                      <span>Thưởng KPI</span>
                      <span className={cx("settlementVal", "green")}>{fmt(preview.bonus)}đ</span>
                    </div>
                  )}

                  <div className={cx("settlementRow", "total")}>
                    <span>Tổng thu nhập</span>
                    <span className={cx("settlementVal", "bold")}>{fmt(preview.totalSalary)}đ</span>
                  </div>
                </div>
              </div>

              {/* ── Khấu trừ ── */}
              <div className={cx("settlementSection")}>
                <div className={cx("settlementSectionTitle")}>
                  Khấu trừ
                  <button className={cx("btn", "small", "outline")} onClick={addDeduction}>
                    <Plus size={12} /> Thêm
                  </button>
                </div>

                {deductions.length === 0 ? (
                  <div className={cx("settlementEmpty")}>Chưa có khoản khấu trừ</div>
                ) : (
                  deductions.map((d, idx) => (
                    <div key={idx} className={cx("deductionRow")}>
                      <input
                        className={cx("input", "inputSmall")}
                        type="date"
                        title="Ngày vi phạm *"
                        value={d.violationDate}
                        onChange={(e) => updateDeduction(idx, "violationDate", e.target.value)}
                      />
                      <input
                        className={cx("input", "inputSmall")}
                        type="number"
                        placeholder="Số tiền (đ) *"
                        value={d.amount}
                        onChange={(e) => updateDeduction(idx, "amount", e.target.value)}
                      />
                      <input
                        className={cx("input", "inputFlex")}
                        type="text"
                        placeholder="Lý do khấu trừ *"
                        value={d.reason}
                        onChange={(e) => updateDeduction(idx, "reason", e.target.value)}
                      />
                      <button
                        className={cx("btn", "small", "danger", "iconBtn")}
                        onClick={() => removeDeduction(idx)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}

                {totalDeductions > 0 && (
                  <div className={cx("settlementRow", "deductionTotal")}>
                    <span>Tổng khấu trừ</span>
                    <span className={cx("settlementVal", "red")}>-{fmt(totalDeductions)}đ</span>
                  </div>
                )}
              </div>

              {/* ── Thực nhận (live) ── */}
              <div className={cx("settlementNetBox")}>
                <span className={cx("settlementNetLabel")}>Thực nhận</span>
                <span className={cx("settlementNetVal", netSalary < 0 ? "red" : "")}>
                  {fmt(Math.max(0, netSalary))}đ
                </span>
              </div>
            </>
          )}
        </div>

        <div className={cx("modalFooter")}>
          <button className={cx("btn", "ghost")} onClick={onClose}>
            <X size={14} /> Hủy
          </button>
          <button
            className={cx("btn", "danger")}
            disabled={loading || !preview}
            onClick={handleConfirm}
          >
            <UserMinus size={14} /> Xác nhận quyết toán
          </button>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════
// CONTRACTS TAB — Main
// ═══════════════════════════════════════════════════════════════════
function ContractsTab({ barbers, activePlans, promotionList = [], salaryPeriod, onReload }) {
  const [modalState, setModalState] = useState(null);
  // modalState: { type: string, barber?: object, promotionItem?: object }

  // ── Handlers ────────────────────────────────────────────────────
  const handleAction = async (action, barber) => {
    switch (action) {

      case "cancel_pending": {
        if (!window.confirm(`Hủy hợp đồng chờ hiệu lực của ${barber.name}?`)) return;
        try {
          await HrPolicyAPI.cancelPendingContract(barber.idSalaryContract);
          alert("Đã hủy hợp đồng.");
          onReload();
        } catch (err) {
          alert("Lỗi: " + (err.message || ""));
        }
        break;
      }

      case "cancel_end_date": {
        if (!window.confirm(`Hủy ngày nghỉ của ${barber.name}?`)) return;
        try {
          await HrPolicyAPI.cancelEndDate(barber.idSalaryContract);
          alert("Đã hủy ngày nghỉ.");
          onReload();
        } catch (err) {
          alert("Lỗi: " + (err.message || ""));
        }
        break;
      }

      default:
        setModalState({ type: action, barber });
    }
  };

  const handleSaveContract = async (mode, formData) => {
    try {
      if (mode === "create") {
        await HrPolicyAPI.assignContract(formData.idBarber || modalState.barber.idBarber, formData);
        alert("Ký hợp đồng thành công!");
      } else if (mode === "edit_pending") {
        await HrPolicyAPI.updatePendingContract(
          modalState.barber.idSalaryContract, formData
        );
        alert("Cập nhật hợp đồng thành công!");
      }
      setModalState(null);
      onReload();
    } catch (err) {
      alert("Lỗi: " + (err.message || ""));
    }
  };

  const handleConfirmEndDate = async (idContract, endDate) => {
    try {
      const res = await HrPolicyAPI.setEndDate(idContract, endDate);
      alert(res.message || "Đã thiết lập ngày nghỉ.");
      setModalState(null);
      onReload();
    } catch (err) {
      alert("Lỗi: " + (err.message || ""));
    }
  };

  const handleConfirmSettle = async (idContract, deductions) => {
    if (!window.confirm("Xác nhận quyết toán và chấm dứt hợp đồng?")) return;
    try {
      await HrPolicyAPI.settleContract(idContract, deductions);
      alert("Quyết toán thành công!");
      setModalState(null);
      onReload();
    } catch (err) {
      alert("Lỗi: " + (err.message || ""));
    }
  };

  const handleConfirmPromote = async ({ idContract, idCompensationPlan, actualBaseSalary, salaryPeriod }) => {
    try {
      await HrPolicyAPI.promoteBarber(idContract, {
        idCompensationPlan,
        actualBaseSalary,
        salaryPeriod,
      });
      alert("Lên cấp thành công!");
      setModalState(null);
      onReload();
    } catch (err) {
      alert("Lỗi: " + (err.message || ""));
    }
  };

  // ── Stats ────────────────────────────────────────────────────────
  const activeCount    = barbers.filter((b) => ["active", "active_with_end"].includes(getContractState(b))).length;
  const noContractCount = barbers.filter((b) => getContractState(b) === "none").length;

  return (
    <div className={cx("tabContent")}>

      {/* Banner lên cấp */}
      <PromotionAlert
        promotionList={promotionList}
        onPromote={(item) => setModalState({ type: "promote", promotionItem: item })}
      />

      <div className={cx("contractsHead")}>
        <div className={cx("sectionTitle")}>
          <FileText size={15} /> Hợp đồng nhân sự
          <span className={cx("sectionCount")}>{barbers.length}</span>
        </div>
        <div className={cx("contractsStats")}>
          <span className={cx("cStat")}>
            <CheckCircle size={12} /> {activeCount} đang hiệu lực
          </span>
          <span className={cx("cStat", "warn")}>
            <AlertTriangle size={12} /> {noContractCount} chưa có HĐ
          </span>
        </div>
      </div>

      <div className={cx("contractsTableWrap")}>
        <table className={cx("contractsTable")}>
          <thead>
            <tr>
              <th>Thợ</th>
              <th>Cấp bậc</th>
              <th>Lương thực tế</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {barbers.map((barber) => (
              <BarberContractRow
                key={barber.idBarber}
                barber={barber}
                plans={activePlans}
                onAction={handleAction}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modalState?.type === "create" && (
        <ContractModal
          mode="create"
          barber={modalState.barber}
          plans={activePlans}
          onSave={handleSaveContract}
          onClose={() => setModalState(null)}
        />
      )}

      {modalState?.type === "edit_pending" && (
        <ContractModal
          mode="edit_pending"
          barber={modalState.barber}
          plans={activePlans}
          onSave={handleSaveContract}
          onClose={() => setModalState(null)}
        />
      )}

      {modalState?.type === "set_end_date" && (
        <EndDateModal
          barber={modalState.barber}
          onConfirm={handleConfirmEndDate}
          onClose={() => setModalState(null)}
        />
      )}

      {modalState?.type === "settle" && (
        <SettlementModal
          barber={modalState.barber}
          onConfirm={handleConfirmSettle}
          onClose={() => setModalState(null)}
        />
      )}

      {modalState?.type === "promote" && (
        <PromoteModal
          promotionItem={modalState.promotionItem}
          plans={activePlans}
          salaryPeriod={salaryPeriod}
          onConfirm={handleConfirmPromote}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}

export default ContractsTab;
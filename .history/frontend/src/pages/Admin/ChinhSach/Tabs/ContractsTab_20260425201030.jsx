import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "../ChinhSach.module.scss";
import {
  FileText, Edit3, CheckCircle, AlertTriangle,
  Save, X, RefreshCw, UserMinus
} from "lucide-react";
import { HrPolicyAPI } from "~/apis/hrPolicyAPI";

const cx = classNames.bind(styles);

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

// Hàm check ngày: So sánh chuỗi YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split("T")[0];

// ─── BarberContractRow ────────────────────────────────────────────
// ─── BarberContractRow ────────────────────────────────────────────
function BarberContractRow({ barber, plans, onAction }) {
  const currentPlan = plans.find(
    (p) => p.idCompensationPlan === barber.idCompensationPlan
  );

  const today = getTodayStr();
  const hasContract = !!barber.idSalaryContract;
  
  // Phân rã 3 trạng thái của hợp đồng
  const isPending = hasContract && barber.startDate > today;
  const isExpired = hasContract && barber.endDate && barber.endDate < today;
  const isActive = hasContract && barber.startDate <= today && !isExpired;

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
        {currentPlan ? (
          <span className={cx("planPill")} style={{ "--plan-color": currentPlan.color || "#3b82f6" }}>
            {currentPlan.displayName}
          </span>
        ) : (
          <span className={cx("noPlan")}>Chưa gắn cấp</span>
        )}
      </td>
      <td>
        <div className={cx("salaryCell")}>
          {barber.actualBaseSalary ? (
            <>
              <span className={cx("salaryVal")}>{fmt(barber.actualBaseSalary)}đ</span>
              {currentPlan && Number(barber.actualBaseSalary) !== Number(currentPlan.defaultBaseSalary) && (
                <span className={cx("salaryCustomTag")}>Custom</span>
              )}
            </>
          ) : (
            "—"
          )}
        </div>
      </td>
      <td>{barber.startDate ? fmtDate(barber.startDate) : "—"}</td>
      <td>{barber.endDate ? fmtDate(barber.endDate) : "—"}</td>
      <td>
        {/* Render UI Label trạng thái */}
        {isPending ? (
          <span className={cx("contractStatus", "pending")}>Chờ hiệu lực</span>
        ) : isExpired ? (
          <span className={cx("contractStatus", "expired")} style={{color: "red"}}>Đã hết hạn</span>
        ) : isActive ? (
          <span className={cx("contractStatus", "active")}>Đang hiệu lực</span>
        ) : (
          <span className={cx("contractStatus", "inactive")}>Chưa có HĐ</span>
        )}
      </td>
      <td>
        <div className={cx("actionGroup")}>
          {/* TRƯỜNG HỢP 1: CHƯA CÓ HỢP ĐỒNG */}
          {!hasContract && (
            <button className={cx("btn", "small", "primary")} onClick={() => onAction("create", barber)}>
              <Edit3 size={13} /> Tạo HĐ
            </button>
          )}

          {/* TRƯỜNG HỢP 2: HỢP ĐỒNG NHÁP (Được Sửa và Hủy) */}
          {isPending && (
            <>
              <button className={cx("btn", "small", "warning")} onClick={() => onAction("edit_pending", barber)}>
                <Edit3 size={13} /> Sửa
              </button>
              <button className={cx("btn", "small", "danger")} onClick={() => onAction("terminate", barber)}>
                <X size={13} /> Hủy bỏ
              </button>
            </>
          )}

          {/* TRƯỜNG HỢP 3: ĐANG HIỆU LỰC (Ký nối tiếp hoặc Chấm dứt) */}
          {isActive && (
            <>
              <button className={cx("btn", "small", "success")} onClick={() => onAction("renew", barber)}>
                <RefreshCw size={13} /> Lên cấp / Đổi HĐ
              </button>
              <button className={cx("btn", "small", "danger")} onClick={() => onAction("terminate", barber)}>
                <UserMinus size={13} /> Chấm dứt
              </button>
            </>
          )}

          {/* TRƯỜNG HỢP 4: ĐÃ HẾT HẠN (Chỉ cho phép Ký mới) */}
          {isExpired && (
            <button className={cx("btn", "small", "success")} onClick={() => onAction("renew", barber)}>
              <RefreshCw size={13} /> Ký HĐ mới
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── ContractModal ────────────────────────────────────────────────
function ContractModal({ mode, barber, plans, onSave, onClose }) {
  const today = getTodayStr();

  // Khởi tạo state dựa vào mode
  const [form, setForm] = useState({
    idBarber: barber.idBarber,
    idSalaryContract: mode === "edit_pending" ? barber.idSalaryContract : null,
    idCompensationPlan: mode === "renew" ? "" : barber.idCompensationPlan || plans[0]?.idCompensationPlan || "",
    actualBaseSalary: mode === "renew" ? 0 : barber.actualBaseSalary || plans[0]?.defaultBaseSalary || 0,
    startDate: mode === "renew" ? today : barber.startDate || today,
    endDate: mode === "renew" ? "" : barber.endDate || "",
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedPlan = plans.find((p) => p.idCompensationPlan === Number(form.idCompensationPlan));

  const handlePlanChange = (pid) => {
    const plan = plans.find((p) => p.idCompensationPlan === Number(pid));
    setForm((f) => ({
      ...f,
      idCompensationPlan: Number(pid),
      actualBaseSalary: plan?.defaultBaseSalary || f.actualBaseSalary,
    }));
  };

  const getTitle = () => {
    if (mode === "create") return "Tạo hợp đồng mới";
    if (mode === "edit_pending") return "Chỉnh sửa hợp đồng (Chưa hiệu lực)";
    if (mode === "renew") return "Ký hợp đồng mới (Lên cấp / Tái ký)";
    return "";
  };

  return (
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox")}>
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>{getTitle()}</div>
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
                  <option key={p.idCompensationPlan} value={p.idCompensationPlan}>{p.displayName}</option>
                ))}
              </select>
            </div>
            
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Lương cứng thực tế (đ)</label>
              <input className={cx("input")} type="number" value={form.actualBaseSalary}
                onChange={(e) => upd("actualBaseSalary", Number(e.target.value))} />
              {selectedPlan && (
                <span className={cx("fieldHint")}>Mặc định: {fmt(selectedPlan.defaultBaseSalary)}đ</span>
              )}
            </div>

            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Ngày bắt đầu <span className={cx("required")}>*</span></label>
              <input className={cx("input")} type="date" value={form.startDate}
                onChange={(e) => upd("startDate", e.target.value)} />
            </div>

            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Ngày kết thúc (Bỏ trống nếu vô thời hạn)</label>
              <input className={cx("input")} type="date" value={form.endDate}
                onChange={(e) => upd("endDate", e.target.value)} />
            </div>
          </div>

          {selectedPlan && Number(form.actualBaseSalary) !== Number(selectedPlan.defaultBaseSalary) && (
            <div className={cx("customSalaryNote")}>
              <AlertTriangle size={13} />
              Lương thực tế khác mức mặc định ({fmt(selectedPlan.defaultBaseSalary)}đ).
            </div>
          )}
        </div>

        <div className={cx("modalFooter")}>
          <button className={cx("btn", "ghost")} onClick={onClose}><X size={14} /> Huỷ</button>
          <button className={cx("btn", "primary")} onClick={() => onSave(mode, form)}>
            <Save size={14} /> Lưu hợp đồng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ContractsTab ─────────────────────────────────────────────────
function ContractsTab({ barbers, activePlans, onReload }) {
  // modalState: { mode: "create" | "edit_pending" | "renew", barber: Object } | null
  const [modalState, setModalState] = useState(null);

  const handleAction = async (action, barber) => {
    if (action === "terminate") {
      const confirm = window.confirm(`Bạn có chắc chắn muốn CHẤM DỨT hợp đồng hiện tại của ${barber.name} không?`);
      if (!confirm) return;
      try {
        await HrPolicyAPI.terminateContract(barber.idSalaryContract);
        alert("Đã chấm dứt hợp đồng thành công.");
        onReload();
      } catch (err) {
        alert("Lỗi: " + (err.message || "Không thể chấm dứt hợp đồng"));
      }
      return;
    }
    // Mở modal cho các action còn lại
    setModalState({ mode: action, barber });
  };

  const handleSaveContract = async (mode, formData) => {
    try {
      if (mode === "create" || mode === "renew") {
        await HrPolicyAPI.assignContract(formData.idBarber, formData);
        alert(mode === "renew" ? "Đã ký hợp đồng mới thành công!" : "Tạo hợp đồng thành công!");
      } else if (mode === "edit_pending") {
        await HrPolicyAPI.updatePendingContract(formData.idSalaryContract, formData);
        alert("Cập nhật hợp đồng nháp thành công!");
      }
      setModalState(null);
      onReload();
    } catch (err) {
      alert("Lỗi lưu hợp đồng: " + (err.message || ""));
    }
  };

  const activeCount = barbers.filter(b => b.idSalaryContract && b.startDate <= getTodayStr()).length;
  const noContractCount = barbers.filter(b => !b.idSalaryContract).length;

  return (
    <div className={cx("tabContent")}>
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

      {modalState !== null && (
        <ContractModal
          mode={modalState.mode}
          barber={modalState.barber}
          plans={activePlans}
          onSave={handleSaveContract}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}

export default ContractsTab;
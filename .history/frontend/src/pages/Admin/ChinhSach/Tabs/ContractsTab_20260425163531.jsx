import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "../ChinhSach.module.scss";
import {
  FileText, Edit3, CheckCircle, AlertTriangle,
  Save, X
} from "lucide-react";
import { HrPolicyAPI } from "~/apis/hrPolicyAPI";

const cx = classNames.bind(styles);

const fmt     = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const CONTRACT_TYPE_LABEL = {
  probation:  "Thử việc",
  full_time:  "Chính thức",
  part_time:  "Bán thời gian",
};

// ─── BarberContractRow ────────────────────────────────────────────
function BarberContractRow({ barber, plans, onEdit }) {
  const currentPlan = plans.find(
    (p) => p.idCompensationPlan === barber.idCompensationPlan && p.effectiveTo === null
  );

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
        {barber.contractType ? (
          <span className={cx("contractTypePill", barber.contractType)}>
            {CONTRACT_TYPE_LABEL[barber.contractType]}
          </span>
        ) : "—"}
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
          ) : "—"}
        </div>
      </td>
      <td>{barber.startDate ? fmtDate(barber.startDate) : "—"}</td>
      <td>
        <span className={cx("contractStatus", barber.status)}>
          {barber.status === "active" ? "Đang làm" : "Chưa có HĐ"}
        </span>
      </td>
      <td>
        <button className={cx("contractEditBtn")} onClick={() => onEdit(barber)}>
          <Edit3 size={13} /> {barber.idSalaryContract ? "Sửa" : "Tạo HĐ"}
        </button>
      </td>
    </tr>
  );
}

// ─── ContractModal ────────────────────────────────────────────────
function ContractModal({ barber, plans, onSave, onClose }) {
  const [form, setForm] = useState({
    idBarber:           barber.idBarber,
    idCompensationPlan: barber.idCompensationPlan || plans[0]?.idCompensationPlan || "",
    actualBaseSalary:   barber.actualBaseSalary   || plans[0]?.defaultBaseSalary  || 0,
    contractType:       barber.contractType       || "full_time",
    startDate:          barber.startDate          || new Date().toISOString().split("T")[0],
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedPlan = plans.find((p) => p.idCompensationPlan === Number(form.idCompensationPlan));

  const handlePlanChange = (pid) => {
    const plan = plans.find((p) => p.idCompensationPlan === Number(pid));
    setForm((f) => ({
      ...f,
      idCompensationPlan: Number(pid),
      actualBaseSalary:   plan?.defaultBaseSalary || f.actualBaseSalary,
    }));
  };

  return (
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox")}>
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>
              {barber.idSalaryContract ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng mới"}
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
                  <option key={p.idCompensationPlan} value={p.idCompensationPlan}>{p.displayName}</option>
                ))}
              </select>
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Loại hợp đồng <span className={cx("required")}>*</span></label>
              <select className={cx("input", "select")} value={form.contractType}
                onChange={(e) => upd("contractType", e.target.value)}>
                <option value="probation">Thử việc</option>
                <option value="full_time">Chính thức</option>
                <option value="part_time">Bán thời gian</option>
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
          </div>

          {selectedPlan && Number(form.actualBaseSalary) !== Number(selectedPlan.defaultBaseSalary) && (
            <div className={cx("customSalaryNote")}>
              <AlertTriangle size={13} />
              Lương thực tế khác mức mặc định ({fmt(selectedPlan.defaultBaseSalary)}đ). Đây là thỏa thuận riêng.
            </div>
          )}
        </div>

        <div className={cx("modalFooter")}>
          <button className={cx("btn", "ghost")} onClick={onClose}><X size={14} /> Huỷ</button>
          <button className={cx("btn", "primary")} onClick={() => onSave(form)}>
            <Save size={14} /> {barber.idSalaryContract ? "Cập nhật" : "Lưu hợp đồng"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ContractsTab ─────────────────────────────────────────────────
function ContractsTab({ barbers, activePlans, onReload }) {
  const [contractModal, setContractModal] = useState(null);

  const handleSaveContract = async (formData) => {
    try {
      await HrPolicyAPI.assignContract(formData.idBarber, formData);
      alert("Cấp hợp đồng mới thành công!");
      setContractModal(null);
      onReload();
    } catch (err) {
      alert("Lỗi khi cấp hợp đồng: " + (err.message || ""));
    }
  };

  return (
    <div className={cx("tabContent")}>
      <div className={cx("contractsHead")}>
        <div className={cx("sectionTitle")}>
          <FileText size={15} /> Hợp đồng nhân sự
          <span className={cx("sectionCount")}>{barbers.length}</span>
        </div>
        <div className={cx("contractsStats")}>
          <span className={cx("cStat")}>
            <CheckCircle size={12} /> {barbers.filter((b) => b.status === "active").length} đang làm
          </span>
          <span className={cx("cStat", "warn")}>
            <AlertTriangle size={12} /> {barbers.filter((b) => b.status === "no_contract").length} chưa có HĐ
          </span>
        </div>
      </div>

      <div className={cx("contractsTableWrap")}>
        <table className={cx("contractsTable")}>
          <thead>
            <tr>
              <th>Thợ</th>
              <th>Cấp bậc</th>
              <th>Loại HĐ</th>
              <th>Lương thực tế</th>
              <th>Ngày bắt đầu</th>
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
                onEdit={(b) => setContractModal(b)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {contractModal !== null && (
        <ContractModal
          barber={contractModal}
          plans={activePlans}
          onSave={handleSaveContract}
          onClose={() => setContractModal(null)}
        />
      )}
    </div>
  );
}

export default ContractsTab;
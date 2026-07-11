import React, { useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import styles from "../ChinhSach.module.scss";
import {
  CheckCircle, Clock, XCircle, ArrowRight,
  TrendingUp, Plus, Edit3, ChevronRight,
  Calendar, Crown, Zap, Save, X, Trash2
} from "lucide-react";
import { HrPolicyAPI } from "~/apis/hrPolicyAPI";

const cx = classNames.bind(styles);

const fmt     = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// ─── PlanCard ─────────────────────────────────────────────────────
function PlanCard({ plan, isSelected, onClick, onEdit, onDelete }) {
  const isExpired = plan.effectiveTo !== null;
  return (
    <div
      className={cx("planCard", { selected: isSelected, expired: isExpired })}
      onClick={!isExpired ? onClick : undefined}
      style={{ "--plan-color": plan.color || "#3b82f6" }}
    >
      <div className={cx("planCardAccent")} />
      <div className={cx("planCardHead")}>
        <div
          className={cx("planBadge")}
          style={{ background: `${plan.color || "#3b82f6"}18`, color: plan.color || "#3b82f6" }}
        >
          {isExpired ? <XCircle size={12} /> : <CheckCircle size={12} />}
          {isExpired ? "Đã đóng" : "Đang áp dụng"}
        </div>

        {/* Chỉ hiện nút Sửa / Xóa khi Plan còn active */}
        {!isExpired && (
          <div className={cx("planCardActions")}>
            <button
              className={cx("planEditBtn")}
              onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
              title="Chỉnh sửa thông tin cấp bậc"
            >
              <Edit3 size={13} />
            </button>
            <button
              className={cx("planDeleteBtn")}
              onClick={(e) => { e.stopPropagation(); onDelete(plan); }}
              title="Xóa cấp bậc (chỉ được khi không có thợ nào đang dùng)"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <div
        className={cx("planIcon")}
        style={{ background: `${plan.color || "#3b82f6"}15` }}
      >
        {plan.levelOrder === 1 && <Zap size={20} style={{ color: plan.color || "#3b82f6" }} />}
        {plan.levelOrder === 2 && <TrendingUp size={20} style={{ color: plan.color || "#3b82f6" }} />}
        {plan.levelOrder >= 3 && <Crown size={20} style={{ color: plan.color || "#3b82f6" }} />}
      </div>

      <div className={cx("planName")}>{plan.displayName}</div>

      <div className={cx("planStats")}>
        <div className={cx("planStat")}>
          <span className={cx("planStatLabel")}>Lương cứng</span>
          <span className={cx("planStatVal")}>{fmt(plan.defaultBaseSalary)}đ</span>
        </div>
        {plan.minRevenueToPromote && (
          <div className={cx("planStat")}>
            <span className={cx("planStatLabel")}>Mốc thăng</span>
            <span className={cx("planStatVal")}>{fmt(plan.minRevenueToPromote / 1000000)}tr</span>
          </div>
        )}
      </div>

      <div className={cx("planDateRange")}>
        <Calendar size={11} />
        {fmtDate(plan.effectiveFrom)}
        {plan.effectiveTo ? ` → ${fmtDate(plan.effectiveTo)}` : " → Hiện tại"}
      </div>

      {isSelected && !isExpired && (
        <div className={cx("planSelectedIndicator")}>
          <ChevronRight size={14} />
        </div>
      )}
    </div>
  );
}

// ─── PlanModal ────────────────────────────────────────────────────
// Đẩy ra document.body bằng createPortal để không bị khung tab "nhốt" lại
function PlanModal({ plan, onSave, onClose }) {
  const isEdit = !!plan.idCompensationPlan;
  const [form, setForm] = useState({
    idCompensationPlan:     plan.idCompensationPlan || null,
    roleType:               plan.roleType || "",
    displayName:            plan.displayName || "",
    defaultBaseSalary:      plan.defaultBaseSalary || 3000000,
    minRevenueToPromote:    plan.minRevenueToPromote || "",
    evaluationPeriodMonths: plan.evaluationPeriodMonths || 1,
    minMonthsInLevel:       plan.minMonthsInLevel || 0,
    effectiveFrom:          plan.effectiveFrom || new Date().toISOString().split("T")[0],
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return createPortal(
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox")}>
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>{isEdit ? "Chỉnh sửa cấp bậc" : "Thêm cấp bậc mới"}</div>
            <div className={cx("modalSubtitle")}>{isEdit ? plan.displayName : "Tạo cấp bậc nhân sự mới"}</div>
          </div>
          <button className={cx("modalCloseBtn")} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={cx("modalBody")}>
          <div className={cx("formGrid")}>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Tên hiển thị <span className={cx("required")}>*</span></label>
              <input className={cx("input")} value={form.displayName}
                onChange={(e) => upd("displayName", e.target.value)} placeholder="VD: Thợ Junior" />
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Mã hệ thống (roleType) <span className={cx("required")}>*</span></label>
              <input className={cx("input")} value={form.roleType}
                onChange={(e) => upd("roleType", e.target.value)}
                placeholder="junior / senior / master" disabled={isEdit} />
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Lương cứng mặc định (đ) <span className={cx("required")}>*</span></label>
              <input className={cx("input")} type="number" value={form.defaultBaseSalary}
                onChange={(e) => upd("defaultBaseSalary", Number(e.target.value))} />
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Ngày áp dụng từ <span className={cx("required")}>*</span></label>
              <input className={cx("input")} type="date" value={form.effectiveFrom}
                onChange={(e) => upd("effectiveFrom", e.target.value)} />
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Doanh thu tối thiểu để thăng cấp (đ)</label>
              <input className={cx("input")} type="number" value={form.minRevenueToPromote}
                onChange={(e) => upd("minRevenueToPromote", e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Số tháng đánh giá KPI</label>
              <input className={cx("input")} type="number" min="1" value={form.evaluationPeriodMonths}
                onChange={(e) => upd("evaluationPeriodMonths", Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className={cx("modalFooter")}>
          <button className={cx("btn", "ghost")} onClick={onClose}><X size={14} /> Huỷ</button>
          <button className={cx("btn", "primary")} onClick={() => onSave(form)}>
            <Save size={14} /> {isEdit ? "Cập nhật" : "Lưu cấp bậc"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── PlansTab ─────────────────────────────────────────────────────
function PlansTab({ plans, onSavePlan, onReload }) {
  const [showExpired, setShowExpired] = useState(false);
  const [planModal,   setPlanModal]   = useState(null);

  const activePlans  = plans.filter((p) => p.effectiveTo === null);
  const expiredPlans = plans.filter((p) => p.effectiveTo !== null);

  const handleSave = async (formData) => {
    await onSavePlan(formData);
    setPlanModal(null);
  };

  // Xóa Plan — backend sẽ block 409 nếu còn thợ đang dùng
  const handleDelete = async (plan) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa cấp bậc "${plan.displayName}" không?\n` +
      `Lưu ý: Không thể xóa nếu đang có thợ sử dụng cấp bậc này.`
    );
    if (!confirmed) return;

    try {
      await HrPolicyAPI.deletePlan(plan.idCompensationPlan);
      alert(`Đã xóa cấp bậc "${plan.displayName}" thành công.`);
      onReload();
    } catch (err) {
      // 409: Còn thợ đang dùng → thông báo rõ ràng
      alert(err.message || "Không thể xóa cấp bậc này.");
    }
  };

  return (
    <div className={cx("tabContent")}>

      {/* Header hành động */}
      <div className={cx("pageHeader")} style={{ marginBottom: 20 }}>
        <div />
        <button className={cx("addPlanBtn")} onClick={() => setPlanModal({})}>
          <Plus size={15} /> Thêm cấp bậc mới
        </button>
      </div>

      {/* Danh sách đang áp dụng */}
      <div className={cx("sectionHead")}>
        <div className={cx("sectionTitle")}>
          <CheckCircle size={15} /> Đang áp dụng
          <span className={cx("sectionCount")}>{activePlans.length}</span>
        </div>
      </div>

      <div className={cx("plansGrid")}>
        {activePlans.map((plan, i) => (
          <React.Fragment key={plan.idCompensationPlan}>
            <PlanCard
              plan={plan}
              isSelected={false}
              onClick={() => {}}
              onEdit={(p) => setPlanModal(p)}
              onDelete={handleDelete}
            />
            {i < activePlans.length - 1 && (
              <div className={cx("planArrow")}>
                <ArrowRight size={18} />
                <span>Thăng cấp</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Lộ trình thăng tiến */}
      <div className={cx("ladderCard")}>
        <div className={cx("ladderTitle")}>
          <TrendingUp size={15} /> Lộ trình thăng tiến tự động
        </div>
        <div className={cx("ladder")}>
          {activePlans.map((plan, i) => (
            <div
              key={plan.idCompensationPlan}
              className={cx("ladderStep")}
              style={{ "--step-color": plan.color || "#3b82f6" }}
            >
              <div className={cx("ladderDot")} />
              <div className={cx("ladderInfo")}>
                <div className={cx("ladderPlanName")}>{plan.displayName}</div>
                {plan.minRevenueToPromote ? (
                  <div className={cx("ladderRequire")}>
                    Đạt {fmt(plan.minRevenueToPromote / 1000000)}tr/tháng
                    ×{plan.evaluationPeriodMonths} tháng
                    {plan.minMonthsInLevel ? ` · Tối thiểu ${plan.minMonthsInLevel} tháng ở cấp này` : ""}
                  </div>
                ) : (
                  <div className={cx("ladderRequire", "top")}>🏆 Cấp cao nhất</div>
                )}
              </div>
              {i < activePlans.length - 1 && <div className={cx("ladderLine")} />}
            </div>
          ))}
        </div>
      </div>

      {/* Lịch sử */}
      <div className={cx("sectionHead")} style={{ marginTop: 32 }}>
        <div className={cx("sectionTitle")}>
          <Clock size={15} /> Lịch sử chính sách cũ
          <span className={cx("sectionCount", "expired")}>{expiredPlans.length}</span>
        </div>
        <button className={cx("toggleExpiredBtn")} onClick={() => setShowExpired(!showExpired)}>
          {showExpired ? "Ẩn" : "Xem lịch sử"}
        </button>
      </div>

      {showExpired && (
        <div className={cx("expiredPlans")}>
          {expiredPlans.length === 0 ? (
            <div className={cx("emptyHint")}>Chưa có chính sách cũ nào</div>
          ) : (
            <div className={cx("plansGrid", "expiredGrid")}>
              {expiredPlans.map((plan) => (
                <PlanCard
                  key={plan.idCompensationPlan}
                  plan={plan} isSelected={false}
                  onClick={() => {}} onEdit={() => {}} onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {planModal !== null && (
        <PlanModal plan={planModal} onSave={handleSave} onClose={() => setPlanModal(null)} />
      )}
    </div>
  );
}

export default PlansTab;
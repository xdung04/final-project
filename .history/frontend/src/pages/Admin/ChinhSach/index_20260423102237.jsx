import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./ChinhSach.module.scss";
import {
  Layers, Percent, Trophy, FileText,
  Plus, Trash2, Edit3, ChevronRight,
  CheckCircle, Clock, XCircle, ArrowRight,
  TrendingUp, Star, Users, DollarSign,
  Save, X, AlertTriangle, Crown,
  Calendar, Award, Zap,
} from "lucide-react";

const cx = classNames.bind(styles);

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_PLANS = [
  {
    planId: 1, roleType: "junior", displayName: "Thợ Junior", levelOrder: 1,
    defaultBaseSalary: 3000000, minRevenueToPromote: 30000000,
    evaluationPeriodMonths: 3, minMonthsInLevel: 6,
    effectiveFrom: "2025-01-01", effectiveTo: null, isActive: true,
    color: "#3b82f6",
  },
  {
    planId: 2, roleType: "senior", displayName: "Thợ Senior", levelOrder: 2,
    defaultBaseSalary: 4500000, minRevenueToPromote: 50000000,
    evaluationPeriodMonths: 3, minMonthsInLevel: 12,
    effectiveFrom: "2025-01-01", effectiveTo: null, isActive: true,
    color: "#8b5cf6",
  },
  {
    planId: 3, roleType: "master", displayName: "Thợ Master", levelOrder: 3,
    defaultBaseSalary: 6000000, minRevenueToPromote: null,
    evaluationPeriodMonths: null, minMonthsInLevel: null,
    effectiveFrom: "2025-01-01", effectiveTo: null, isActive: true,
    color: "#f59e0b",
  },
  // Old version
  {
    planId: 99, roleType: "junior", displayName: "Thợ Junior (Cũ)", levelOrder: 1,
    defaultBaseSalary: 2500000, minRevenueToPromote: 25000000,
    evaluationPeriodMonths: 3, minMonthsInLevel: 6,
    effectiveFrom: "2024-01-01", effectiveTo: "2024-12-31", isActive: false,
    color: "#6b7280",
  },
];

const MOCK_COMMISSION_RULES = {
  1: [
    { ruleId: 1, planId: 1, minRevenueStep: 0, maxRevenueStep: 20000000, commissionRate: 15 },
    { ruleId: 2, planId: 1, minRevenueStep: 20000000, maxRevenueStep: null, commissionRate: 17 },
  ],
  2: [
    { ruleId: 3, planId: 2, minRevenueStep: 0, maxRevenueStep: 30000000, commissionRate: 18 },
    { ruleId: 4, planId: 2, minRevenueStep: 30000000, maxRevenueStep: 50000000, commissionRate: 20 },
    { ruleId: 5, planId: 2, minRevenueStep: 50000000, maxRevenueStep: null, commissionRate: 22 },
  ],
  3: [
    { ruleId: 6, planId: 3, minRevenueStep: 0, maxRevenueStep: null, commissionRate: 22 },
  ],
};

const MOCK_BONUS_RULES = {
  1: [
    { bonusId: 1, planId: 1, bonusName: "Thưởng Chất Lượng", minCustomerCount: 200, minAverageRating: 4.5, evaluationPeriodMonths: 1, rewardAmount: 500000 },
  ],
  2: [
    { bonusId: 2, planId: 2, bonusName: "Thưởng Senior Star", minCustomerCount: 250, minAverageRating: 4.7, evaluationPeriodMonths: 1, rewardAmount: 1000000 },
  ],
  3: [
    { bonusId: 3, planId: 3, bonusName: "Thưởng Master Elite", minCustomerCount: 300, minAverageRating: 4.8, evaluationPeriodMonths: 1, rewardAmount: 1500000 },
  ],
};

const MOCK_BARBERS = [
  { barberId: 1, name: "Nguyễn Văn A", avatar: "A", branch: "Quận 1", contractId: 1, planId: 1, actualBaseSalary: 3000000, contractType: "full_time", startDate: "2024-06-01", status: "active" },
  { barberId: 2, name: "Trần Minh B",  avatar: "T", branch: "Quận 3", contractId: 2, planId: 2, actualBaseSalary: 5000000, contractType: "full_time", startDate: "2024-01-15", status: "active" },
  { barberId: 3, name: "Phạm Thị C",   avatar: "P", branch: "Quận 1", contractId: 3, planId: 1, actualBaseSalary: 3000000, contractType: "probation", startDate: "2025-03-01", status: "active" },
  { barberId: 4, name: "Lê Hoàng D",   avatar: "L", branch: "Quận 7", contractId: 4, planId: 3, actualBaseSalary: 6500000, contractType: "full_time", startDate: "2023-05-10", status: "active" },
  { barberId: 5, name: "Đinh Quang E", avatar: "Đ", branch: "Quận 3", contractId: null, planId: null, contractType: null, startDate: null, status: "no_contract" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const CONTRACT_TYPE_LABEL = { probation: "Thử việc", full_time: "Chính thức", part_time: "Bán thời gian" };

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "plans",     label: "Cấp bậc",      icon: Layers },
  { id: "rules",     label: "Hoa hồng & Thưởng", icon: Percent },
  { id: "contracts", label: "Hợp đồng",     icon: FileText },
];

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ─── Plan Card ────────────────────────────────────────────────────
function PlanCard({ plan, isSelected, onClick, onEdit }) {
  const isExpired = !plan.isActive;
  return (
    <div
      className={cx("planCard", { selected: isSelected, expired: isExpired })}
      onClick={!isExpired ? onClick : undefined}
      style={{ "--plan-color": plan.color }}
    >
      <div className={cx("planCardAccent")} />
      <div className={cx("planCardHead")}>
        <div className={cx("planBadge")} style={{ background: `${plan.color}18`, color: plan.color }}>
          {isExpired ? <XCircle size={12} /> : <CheckCircle size={12} />}
          {isExpired ? "Đã đóng" : "Đang áp dụng"}
        </div>
        {!isExpired && (
          <button className={cx("planEditBtn")} onClick={(e) => { e.stopPropagation(); onEdit(plan); }}>
            <Edit3 size={13} />
          </button>
        )}
      </div>

      <div className={cx("planIcon")} style={{ background: `${plan.color}15` }}>
        {plan.levelOrder === 1 && <Zap size={20} style={{ color: plan.color }} />}
        {plan.levelOrder === 2 && <TrendingUp size={20} style={{ color: plan.color }} />}
        {plan.levelOrder === 3 && <Crown size={20} style={{ color: plan.color }} />}
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

// ─── Commission Tier Row ──────────────────────────────────────────
function CommissionRow({ rule, index, isLast, onChange, onRemove }) {
  return (
    <div className={cx("commRow")}>
      <div className={cx("commRowIndex")}>{index + 1}</div>

      <div className={cx("commRange")}>
        <div className={cx("commField")}>
          <label className={cx("commFieldLabel")}>Từ (đ)</label>
          <input
            type="number" className={cx("commInput")}
            value={rule.minRevenueStep}
            onChange={(e) => onChange({ ...rule, minRevenueStep: Number(e.target.value) })}
            disabled={index === 0}
          />
        </div>
        <div className={cx("commSeparator")}><ArrowRight size={14} /></div>
        <div className={cx("commField")}>
          <label className={cx("commFieldLabel")}>Đến (đ)</label>
          {isLast ? (
            <div className={cx("commInfinity")}>∞ Vô cực</div>
          ) : (
            <input
              type="number" className={cx("commInput")}
              value={rule.maxRevenueStep || ""}
              onChange={(e) => onChange({ ...rule, maxRevenueStep: e.target.value ? Number(e.target.value) : null })}
            />
          )}
        </div>
      </div>

      <div className={cx("commRateWrap")}>
        <label className={cx("commFieldLabel")}>Tỷ lệ</label>
        <div className={cx("commRateInput")}>
          <input
            type="number" className={cx("commInput", "rateInput")}
            value={rule.commissionRate} min="0" max="100" step="0.5"
            onChange={(e) => onChange({ ...rule, commissionRate: Number(e.target.value) })}
          />
          <span className={cx("commRateSuffix")}>%</span>
        </div>
      </div>

      <button
        className={cx("commRemoveBtn")}
        onClick={() => onRemove(rule.ruleId)}
        disabled={index === 0}
        title="Xóa bậc này"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── Bonus Rule Card ──────────────────────────────────────────────
function BonusCard({ bonus, onEdit, onRemove }) {
  return (
    <div className={cx("bonusCard")}>
      <div className={cx("bonusCardHead")}>
        <div className={cx("bonusName")}>
          <Trophy size={14} />
          {bonus.bonusName}
        </div>
        <div className={cx("bonusActions")}>
          <button className={cx("bonusActionBtn")} onClick={() => onEdit(bonus)}>
            <Edit3 size={13} />
          </button>
          <button className={cx("bonusActionBtn", "danger")} onClick={() => onRemove(bonus.bonusId)}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className={cx("bonusConditions")}>
        <div className={cx("bonusCondition")}>
          <Users size={13} />
          <span>Tối thiểu <strong>{bonus.minCustomerCount}</strong> khách</span>
        </div>
        <div className={cx("bonusCondition")}>
          <Star size={13} />
          <span>Rating ≥ <strong>{bonus.minAverageRating}</strong> ⭐</span>
        </div>
        <div className={cx("bonusCondition")}>
          <Calendar size={13} />
          <span>Đánh giá trong <strong>{bonus.evaluationPeriodMonths}</strong> tháng</span>
        </div>
      </div>

      <div className={cx("bonusReward")}>
        <DollarSign size={14} />
        Thưởng: <strong>{fmt(bonus.rewardAmount)}đ</strong>
      </div>
    </div>
  );
}

// ─── Barber Contract Row ──────────────────────────────────────────
function BarberContractRow({ barber, plans, onEdit }) {
  const currentPlan = plans.find((p) => p.planId === barber.planId && p.isActive);

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
          <span className={cx("planPill")} style={{ "--plan-color": currentPlan.color }}>
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
      <td className={cx("salaryCell")}>
        {barber.actualBaseSalary ? (
          <>
            <span className={cx("salaryVal")}>{fmt(barber.actualBaseSalary)}đ</span>
            {currentPlan && barber.actualBaseSalary !== currentPlan.defaultBaseSalary && (
              <span className={cx("salaryCustomTag")}>Custom</span>
            )}
          </>
        ) : "—"}
      </td>
      <td>{barber.startDate ? fmtDate(barber.startDate) : "—"}</td>
      <td>
        <span className={cx("contractStatus", barber.status)}>
          {barber.status === "active" ? "Đang làm" : "Chưa có HĐ"}
        </span>
      </td>
      <td>
        <button className={cx("contractEditBtn")} onClick={() => onEdit(barber)}>
          <Edit3 size={13} /> {barber.contractId ? "Sửa" : "Tạo HĐ"}
        </button>
      </td>
    </tr>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────
function Modal({ open, title, subtitle, onClose, children, wide }) {
  if (!open) return null;
  return (
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox", { wide })}>
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>{title}</div>
            {subtitle && <div className={cx("modalSubtitle")}>{subtitle}</div>}
          </div>
          <button className={cx("modalCloseBtn")} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={cx("modalBody")}>{children}</div>
      </div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────
function Field({ label, hint, children, required }) {
  return (
    <div className={cx("field")}>
      <label className={cx("fieldLabel")}>{label}{required && <span className={cx("required")}>*</span>}</label>
      {children}
      {hint && <span className={cx("fieldHint")}>{hint}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
function ChinhSach() {
  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans]   = useState(MOCK_PLANS);
  const [commissionRules, setCommissionRules] = useState(MOCK_COMMISSION_RULES);
  const [bonusRules, setBonusRules]           = useState(MOCK_BONUS_RULES);
  const [barbers, setBarbers] = useState(MOCK_BARBERS);

  // Selected plan for rules tab
  const [selectedPlanId, setSelectedPlanId] = useState(1);

  // Modals
  const [planModal, setPlanModal]         = useState(null); // null | plan object (new: {})
  const [bonusModal, setBonusModal]       = useState(null); // null | { planId, bonus? }
  const [contractModal, setContractModal] = useState(null); // null | barber object

  // Show expired toggle
  const [showExpired, setShowExpired] = useState(false);

  const activePlans  = plans.filter((p) => p.isActive);
  const expiredPlans = plans.filter((p) => !p.isActive);
  const selectedPlan = activePlans.find((p) => p.planId === selectedPlanId);

  // ── Commission rules handlers ──────────────────────────────────
  const handleAddCommissionRow = () => {
    const rules = commissionRules[selectedPlanId] || [];
    const lastRule = rules[rules.length - 1];
    const newRule = {
      ruleId: Date.now(),
      planId: selectedPlanId,
      minRevenueStep: lastRule?.maxRevenueStep || 0,
      maxRevenueStep: null,
      commissionRate: lastRule?.commissionRate || 15,
    };
    // Update previous last rule to have maxRevenueStep
    const updated = rules.map((r, i) =>
      i === rules.length - 1 ? { ...r, maxRevenueStep: newRule.minRevenueStep } : r
    );
    setCommissionRules((prev) => ({ ...prev, [selectedPlanId]: [...updated, newRule] }));
  };

  const handleUpdateCommissionRow = (ruleId, updatedRule) => {
    setCommissionRules((prev) => ({
      ...prev,
      [selectedPlanId]: prev[selectedPlanId].map((r) => r.ruleId === ruleId ? updatedRule : r),
    }));
  };

  const handleRemoveCommissionRow = (ruleId) => {
    const rules = commissionRules[selectedPlanId];
    if (rules.length <= 1) return;
    const filtered = rules.filter((r) => r.ruleId !== ruleId);
    // Make last rule maxRevenueStep = null
    const updated = filtered.map((r, i) => i === filtered.length - 1 ? { ...r, maxRevenueStep: null } : r);
    setCommissionRules((prev) => ({ ...prev, [selectedPlanId]: updated }));
  };

  // ── Bonus rules handlers ───────────────────────────────────────
  const handleSaveBonus = (formData) => {
    const pid = formData.planId;
    const existing = bonusRules[pid] || [];
    if (formData.bonusId) {
      setBonusRules((prev) => ({ ...prev, [pid]: existing.map((b) => b.bonusId === formData.bonusId ? formData : b) }));
    } else {
      setBonusRules((prev) => ({ ...prev, [pid]: [...existing, { ...formData, bonusId: Date.now() }] }));
    }
    setBonusModal(null);
  };

  const handleRemoveBonus = (planId, bonusId) => {
    setBonusRules((prev) => ({ ...prev, [planId]: (prev[planId] || []).filter((b) => b.bonusId !== bonusId) }));
  };

  // ── Plan modal save ────────────────────────────────────────────
  const handleSavePlan = (formData) => {
    if (formData.planId) {
      setPlans((prev) => prev.map((p) => p.planId === formData.planId ? { ...p, ...formData } : p));
    } else {
      setPlans((prev) => [...prev, { ...formData, planId: Date.now(), isActive: true, levelOrder: activePlans.length + 1, color: "#6366f1" }]);
    }
    setPlanModal(null);
  };

  // ── Contract modal save ────────────────────────────────────────
  const handleSaveContract = (formData) => {
    setBarbers((prev) => prev.map((b) => b.barberId === formData.barberId ? { ...b, ...formData, contractId: b.contractId || Date.now(), status: "active" } : b));
    setContractModal(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className={cx("page")}>

      {/* ── Page Header ── */}
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Nhân sự & Tài chính</div>
          <h1 className={cx("pageTitle")}>Chính sách & KPI</h1>
          <p className={cx("pageDesc")}>Cấu hình cấp bậc, hoa hồng, thưởng KPI và hợp đồng nhân sự</p>
        </div>
        <button className={cx("addPlanBtn")} onClick={() => setPlanModal({})}>
          <Plus size={15} /> Thêm cấp bậc mới
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className={cx("tabs")}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={cx("tab", { active: activeTab === tab.id })}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 1: COMPENSATION PLANS                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "plans" && (
        <div className={cx("tabContent")}>

          {/* Active Plans */}
          <div className={cx("sectionHead")}>
            <div className={cx("sectionTitle")}>
              <CheckCircle size={15} /> Đang áp dụng
              <span className={cx("sectionCount")}>{activePlans.length}</span>
            </div>
          </div>

          <div className={cx("plansGrid")}>
            {activePlans.map((plan, i) => (
              <React.Fragment key={plan.planId}>
                <PlanCard
                  plan={plan}
                  isSelected={false}
                  onClick={() => {}}
                  onEdit={(p) => setPlanModal(p)}
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

          {/* Promotion ladder visualization */}
          <div className={cx("ladderCard")}>
            <div className={cx("ladderTitle")}>
              <TrendingUp size={15} /> Lộ trình thăng tiến tự động
            </div>
            <div className={cx("ladder")}>
              {activePlans.map((plan, i) => (
                <div key={plan.planId} className={cx("ladderStep")} style={{ "--step-color": plan.color }}>
                  <div className={cx("ladderDot")} />
                  <div className={cx("ladderInfo")}>
                    <div className={cx("ladderPlanName")}>{plan.displayName}</div>
                    {plan.minRevenueToPromote ? (
                      <div className={cx("ladderRequire")}>
                        Đạt {fmt(plan.minRevenueToPromote / 1000000)}tr/tháng ×{plan.evaluationPeriodMonths} tháng
                        {plan.minMonthsInLevel && ` · Tối thiểu ${plan.minMonthsInLevel} tháng ở cấp này`}
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

          {/* Expired Plans (History) */}
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
                    <PlanCard key={plan.planId} plan={plan} isSelected={false} onClick={() => {}} onEdit={() => {}} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2: COMMISSION & BONUS RULES                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "rules" && (
        <div className={cx("tabContent")}>
          <div className={cx("rulesLayout")}>

            {/* Left: Plan selector */}
            <div className={cx("planSelector")}>
              <div className={cx("planSelectorTitle")}>Chọn cấp bậc</div>
              {activePlans.map((plan) => (
                <button
                  key={plan.planId}
                  className={cx("planSelectorItem", { active: selectedPlanId === plan.planId })}
                  onClick={() => setSelectedPlanId(plan.planId)}
                  style={{ "--plan-color": plan.color }}
                >
                  <div className={cx("planSelectorDot")} />
                  <div>
                    <div className={cx("planSelectorName")}>{plan.displayName}</div>
                    <div className={cx("planSelectorBase")}>{fmt(plan.defaultBaseSalary)}đ cứng</div>
                  </div>
                  <ChevronRight size={14} className={cx("planSelectorArrow")} />
                </button>
              ))}
            </div>

            {/* Right: Rules panel */}
            {selectedPlan && (
              <div className={cx("rulesPanel")}>

                {/* Commission Rules */}
                <div className={cx("rulesSection")}>
                  <div className={cx("rulesSectionHead")}>
                    <div className={cx("rulesSectionTitle")}>
                      <Percent size={15} /> Bậc thang Hoa hồng
                      <span className={cx("rulesPlanTag")} style={{ color: selectedPlan.color }}>
                        {selectedPlan.displayName}
                      </span>
                    </div>
                    <button className={cx("addRowBtn")} onClick={handleAddCommissionRow}>
                      <Plus size={13} /> Thêm bậc
                    </button>
                  </div>

                  <div className={cx("commHeader")}>
                    <span>Khoảng doanh thu</span>
                    <span>Tỷ lệ %</span>
                  </div>

                  <div className={cx("commRows")}>
                    {(commissionRules[selectedPlanId] || []).map((rule, i, arr) => (
                      <CommissionRow
                        key={rule.ruleId}
                        rule={rule}
                        index={i}
                        isLast={i === arr.length - 1}
                        onChange={(updated) => handleUpdateCommissionRow(rule.ruleId, updated)}
                        onRemove={handleRemoveCommissionRow}
                      />
                    ))}
                  </div>

                  {/* Preview */}
                  <div className={cx("commPreview")}>
                    <div className={cx("commPreviewTitle")}>Ví dụ tính toán</div>
                    {(commissionRules[selectedPlanId] || []).map((rule, i, arr) => {
                      const exRevenue = rule.minRevenueStep + (rule.maxRevenueStep ? (rule.maxRevenueStep - rule.minRevenueStep) / 2 : 10000000);
                      const earn = exRevenue * rule.commissionRate / 100;
                      return (
                        <div key={rule.ruleId} className={cx("commPreviewRow")}>
                          <span>DT {fmt(Math.round(exRevenue / 1000000))}tr</span>
                          <span className={cx("previewArrow")}>→</span>
                          <span className={cx("previewRate")}>{rule.commissionRate}%</span>
                          <span className={cx("previewEarn")}>= {fmt(Math.round(earn))}đ HH</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={cx("saveRow")}>
                    <button className={cx("saveBtn")}>
                      <Save size={14} /> Lưu Hoa hồng
                    </button>
                  </div>
                </div>

                {/* Bonus Rules */}
                <div className={cx("rulesSection")}>
                  <div className={cx("rulesSectionHead")}>
                    <div className={cx("rulesSectionTitle")}>
                      <Trophy size={15} /> Thưởng KPI Combo
                      <span className={cx("rulesPlanTag")} style={{ color: selectedPlan.color }}>
                        {selectedPlan.displayName}
                      </span>
                    </div>
                    <button className={cx("addRowBtn")} onClick={() => setBonusModal({ planId: selectedPlanId })}>
                      <Plus size={13} /> Thêm gói thưởng
                    </button>
                  </div>

                  <div className={cx("bonusNote")}>
                    <AlertTriangle size={13} />
                    Thợ phải đạt <strong>CẢ HAI</strong> điều kiện (số khách + rating) mới nhận thưởng.
                  </div>

                  <div className={cx("bonusCards")}>
                    {(bonusRules[selectedPlanId] || []).length === 0 ? (
                      <div className={cx("emptyHint")}>Chưa có gói thưởng nào. Bấm "Thêm gói thưởng" để bắt đầu.</div>
                    ) : (
                      (bonusRules[selectedPlanId] || []).map((bonus) => (
                        <BonusCard
                          key={bonus.bonusId}
                          bonus={bonus}
                          onEdit={(b) => setBonusModal({ planId: selectedPlanId, bonus: b })}
                          onRemove={(id) => handleRemoveBonus(selectedPlanId, id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 3: CONTRACTS                                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "contracts" && (
        <div className={cx("tabContent")}>
          <div className={cx("contractsHead")}>
            <div className={cx("sectionTitle")}>
              <FileText size={15} /> Hợp đồng nhân sự
              <span className={cx("sectionCount")}>{barbers.length}</span>
            </div>
            <div className={cx("contractsStats")}>
              <span className={cx("cStat")}>
                <CheckCircle size={12} /> {barbers.filter(b => b.status === "active").length} đang làm
              </span>
              <span className={cx("cStat", "warn")}>
                <AlertTriangle size={12} /> {barbers.filter(b => b.status === "no_contract").length} chưa có HĐ
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
                    key={barber.barberId}
                    barber={barber}
                    plans={plans}
                    onEdit={(b) => setContractModal(b)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALS                                                     */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* Plan Modal */}
      {planModal !== null && (
        <PlanModal
          plan={planModal}
          activePlans={activePlans}
          onSave={handleSavePlan}
          onClose={() => setPlanModal(null)}
        />
      )}

      {/* Bonus Modal */}
      {bonusModal !== null && (
        <BonusModal
          data={bonusModal}
          onSave={handleSaveBonus}
          onClose={() => setBonusModal(null)}
        />
      )}

      {/* Contract Modal */}
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

// ─── Plan Modal ───────────────────────────────────────────────────
function PlanModal({ plan, activePlans, onSave, onClose }) {
  const isEdit = !!plan.planId;
  const [form, setForm] = useState({
    planId: plan.planId || null,
    roleType: plan.roleType || "",
    displayName: plan.displayName || "",
    defaultBaseSalary: plan.defaultBaseSalary || 3000000,
    minRevenueToPromote: plan.minRevenueToPromote || "",
    evaluationPeriodMonths: plan.evaluationPeriodMonths || 3,
    minMonthsInLevel: plan.minMonthsInLevel || 6,
    effectiveFrom: plan.effectiveFrom || new Date().toISOString().split("T")[0],
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open title={isEdit ? "Chỉnh sửa cấp bậc" : "Thêm cấp bậc mới"}
      subtitle={isEdit ? plan.displayName : "Tạo cấp bậc nhân sự mới"}
      onClose={onClose}
    >
      <div className={cx("formGrid")}>
        <Field label="Tên hiển thị" required>
          <input className={cx("input")} value={form.displayName} onChange={(e) => upd("displayName", e.target.value)} placeholder="VD: Thợ Junior" />
        </Field>
        <Field label="Mã cấp bậc" required>
          <input className={cx("input")} value={form.roleType} onChange={(e) => upd("roleType", e.target.value)} placeholder="junior / senior / master" />
        </Field>
        <Field label="Lương cứng mặc định (đ)" required hint="Có thể ghi đè trong từng hợp đồng cá nhân">
          <input className={cx("input")} type="number" value={form.defaultBaseSalary} onChange={(e) => upd("defaultBaseSalary", Number(e.target.value))} />
        </Field>
        <Field label="Ngày áp dụng từ" required>
          <input className={cx("input")} type="date" value={form.effectiveFrom} onChange={(e) => upd("effectiveFrom", e.target.value)} />
        </Field>
        <Field label="Doanh thu tối thiểu để thăng cấp (đ)" hint="Để trống nếu đây là cấp cao nhất">
          <input className={cx("input")} type="number" value={form.minRevenueToPromote} onChange={(e) => upd("minRevenueToPromote", e.target.value ? Number(e.target.value) : "")} placeholder="VD: 50000000" />
        </Field>
        <Field label="Số tháng đánh giá KPI" hint="Duy trì doanh thu trên trong X tháng liên tiếp">
          <input className={cx("input")} type="number" min="1" value={form.evaluationPeriodMonths} onChange={(e) => upd("evaluationPeriodMonths", Number(e.target.value))} />
        </Field>
        <Field label="Số tháng tối thiểu ở cấp này" hint="Chống thăng cấp quá nhanh">
          <input className={cx("input")} type="number" min="1" value={form.minMonthsInLevel} onChange={(e) => upd("minMonthsInLevel", Number(e.target.value))} />
        </Field>
      </div>

      <div className={cx("modalFooter")}>
        <button className={cx("btn", "ghost")} onClick={onClose}><X size={14} /> Huỷ</button>
        <button className={cx("btn", "primary")} onClick={() => onSave(form)}>
          <Save size={14} /> {isEdit ? "Cập nhật" : "Tạo cấp bậc"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Bonus Modal ──────────────────────────────────────────────────
function BonusModal({ data, onSave, onClose }) {
  const isEdit = !!data.bonus;
  const [form, setForm] = useState({
    bonusId: data.bonus?.bonusId || null,
    planId: data.planId,
    bonusName: data.bonus?.bonusName || "",
    minCustomerCount: data.bonus?.minCustomerCount || 200,
    minAverageRating: data.bonus?.minAverageRating || 4.5,
    evaluationPeriodMonths: data.bonus?.evaluationPeriodMonths || 1,
    rewardAmount: data.bonus?.rewardAmount || 500000,
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open title={isEdit ? "Chỉnh sửa gói thưởng" : "Thêm gói thưởng KPI"} subtitle="Thợ phải đạt CẢ HAI điều kiện mới nhận" onClose={onClose}>
      <div className={cx("formGrid")}>
        <Field label="Tên gói thưởng" required>
          <input className={cx("input")} value={form.bonusName} onChange={(e) => upd("bonusName", e.target.value)} placeholder="VD: Thưởng Chất Lượng Tháng" />
        </Field>
        <Field label="Số khách tối thiểu" required hint="Tổng lượt khách phục vụ trong kỳ đánh giá">
          <input className={cx("input")} type="number" min="0" value={form.minCustomerCount} onChange={(e) => upd("minCustomerCount", Number(e.target.value))} />
        </Field>
        <Field label="Rating trung bình tối thiểu" required hint="Thang điểm 1–5 sao từ khách hàng">
          <input className={cx("input")} type="number" min="1" max="5" step="0.1" value={form.minAverageRating} onChange={(e) => upd("minAverageRating", Number(e.target.value))} />
        </Field>
        <Field label="Kỳ đánh giá (tháng)" hint="1 = tháng hiện tại, 3 = trung bình 3 tháng gần nhất">
          <input className={cx("input")} type="number" min="1" value={form.evaluationPeriodMonths} onChange={(e) => upd("evaluationPeriodMonths", Number(e.target.value))} />
        </Field>
        <Field label="Tiền thưởng (đ)" required>
          <input className={cx("input")} type="number" min="0" value={form.rewardAmount} onChange={(e) => upd("rewardAmount", Number(e.target.value))} />
        </Field>
      </div>

      <div className={cx("bonusPreviewBox")}>
        <div className={cx("bonusPreviewTitle")}>Xem trước điều kiện</div>
        <div className={cx("bonusPreviewConds")}>
          <span>👥 ≥ {form.minCustomerCount} khách</span>
          <span className={cx("andTag")}>VÀ</span>
          <span>⭐ ≥ {form.minAverageRating} sao</span>
          <span className={cx("andTag")}>→</span>
          <span className={cx("rewardTag")}>💰 +{fmt(form.rewardAmount)}đ</span>
        </div>
      </div>

      <div className={cx("modalFooter")}>
        <button className={cx("btn", "ghost")} onClick={onClose}><X size={14} /> Huỷ</button>
        <button className={cx("btn", "primary")} onClick={() => onSave(form)}>
          <Save size={14} /> {isEdit ? "Cập nhật" : "Thêm gói thưởng"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Contract Modal ───────────────────────────────────────────────
function ContractModal({ barber, plans, onSave, onClose }) {
  const [form, setForm] = useState({
    barberId: barber.barberId,
    planId: barber.planId || plans[0]?.planId || null,
    actualBaseSalary: barber.actualBaseSalary || plans[0]?.defaultBaseSalary || 0,
    contractType: barber.contractType || "full_time",
    startDate: barber.startDate || new Date().toISOString().split("T")[0],
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedPlan = plans.find((p) => p.planId === Number(form.planId));

  // Auto-fill base salary when plan changes
  const handlePlanChange = (planId) => {
    const plan = plans.find((p) => p.planId === Number(planId));
    setForm((f) => ({ ...f, planId: Number(planId), actualBaseSalary: plan?.defaultBaseSalary || f.actualBaseSalary }));
  };

  return (
    <Modal open title={barber.contractId ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng mới"} subtitle={barber.name} onClose={onClose}>
      <div className={cx("formGrid")}>
        <Field label="Cấp bậc" required>
          <select className={cx("input", "select")} value={form.planId || ""} onChange={(e) => handlePlanChange(e.target.value)}>
            <option value="">-- Chọn cấp bậc --</option>
            {plans.map((p) => <option key={p.planId} value={p.planId}>{p.displayName}</option>)}
          </select>
        </Field>
        <Field label="Loại hợp đồng" required>
          <select className={cx("input", "select")} value={form.contractType} onChange={(e) => upd("contractType", e.target.value)}>
            <option value="probation">Thử việc</option>
            <option value="full_time">Chính thức</option>
            <option value="part_time">Bán thời gian</option>
          </select>
        </Field>
        <Field
          label="Lương cứng thực tế (đ)"
          hint={selectedPlan ? `Mặc định cấp ${selectedPlan.displayName}: ${fmt(selectedPlan.defaultBaseSalary)}đ` : ""}
        >
          <input
            className={cx("input")} type="number" min="0"
            value={form.actualBaseSalary}
            onChange={(e) => upd("actualBaseSalary", Number(e.target.value))}
          />
        </Field>
        <Field label="Ngày bắt đầu" required>
          <input className={cx("input")} type="date" value={form.startDate} onChange={(e) => upd("startDate", e.target.value)} />
        </Field>
      </div>

      {selectedPlan && form.actualBaseSalary !== selectedPlan.defaultBaseSalary && (
        <div className={cx("customSalaryNote")}>
          <AlertTriangle size={13} />
          Lương thực tế khác mức mặc định ({fmt(selectedPlan.defaultBaseSalary)}đ).
          Đây là thỏa thuận riêng với thợ này.
        </div>
      )}

      <div className={cx("modalFooter")}>
        <button className={cx("btn", "ghost")} onClick={onClose}><X size={14} /> Huỷ</button>
        <button className={cx("btn", "primary")} onClick={() => onSave(form)}>
          <Save size={14} /> {barber.contractId ? "Cập nhật" : "Tạo hợp đồng"}
        </button>
      </div>
    </Modal>
  );
}

export default ChinhSach;
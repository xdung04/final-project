import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./ChinhSach.module.scss";
import {
  Layers, Percent, Trophy, FileText,
  Plus, Trash2, Edit3, ChevronRight,
  CheckCircle, Clock, XCircle, ArrowRight,
  TrendingUp, Star, Users, DollarSign,
  Save, X, AlertTriangle, Crown,
  Calendar, Zap, Loader
} from "lucide-react";

// Tích hợp API
import { HrPolicyAPI } from "~/apis/hrPolicyAPI"; // Đảm bảo đường dẫn này đúng với dự án của ông

const cx = classNames.bind(styles);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const CONTRACT_TYPE_LABEL = { probation: "Thử việc", full_time: "Chính thức", part_time: "Bán thời gian" };

const TABS = [
  { id: "plans",     label: "Cấp bậc",      icon: Layers },
  { id: "rules",     label: "Hoa hồng & Thưởng", icon: Percent },
  { id: "contracts", label: "Hợp đồng",     icon: FileText },
];

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (Giữ nguyên giao diện của ông, chỉ đổi key ID)
// ═══════════════════════════════════════════════════════════════════

function PlanCard({ plan, isSelected, onClick, onEdit }) {
  const isExpired = plan.effectiveTo !== null; // Kiểm tra xem đã đóng chưa
  return (
    <div
      className={cx("planCard", { selected: isSelected, expired: isExpired })}
      onClick={!isExpired ? onClick : undefined}
      style={{ "--plan-color": plan.color || "#3b82f6" }}
    >
      <div className={cx("planCardAccent")} />
      <div className={cx("planCardHead")}>
        <div className={cx("planBadge")} style={{ background: `${plan.color || "#3b82f6"}18`, color: plan.color || "#3b82f6" }}>
          {isExpired ? <XCircle size={12} /> : <CheckCircle size={12} />}
          {isExpired ? "Đã đóng" : "Đang áp dụng"}
        </div>
        {!isExpired && (
          <button className={cx("planEditBtn")} onClick={(e) => { e.stopPropagation(); onEdit(plan); }}>
            <Edit3 size={13} />
          </button>
        )}
      </div>

      <div className={cx("planIcon")} style={{ background: `${plan.color || "#3b82f6"}15` }}>
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
        onClick={() => onRemove(rule.idCommissionRule || rule.tempId)}
        disabled={index === 0}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

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
          <button className={cx("bonusActionBtn", "danger")} onClick={() => onRemove(bonus.idBonusRule)}>
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

function BarberContractRow({ barber, plans, onEdit }) {
  const currentPlan = plans.find((p) => p.idCompensationPlan === barber.idCompensationPlan);

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
      <td className={cx("salaryCell")}>
        {barber.actualBaseSalary ? (
          <>
            <span className={cx("salaryVal")}>{fmt(barber.actualBaseSalary)}đ</span>
            {currentPlan && Number(barber.actualBaseSalary) !== Number(currentPlan.defaultBaseSalary) && (
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
          <Edit3 size={13} /> {barber.idSalaryContract ? "Sửa" : "Tạo HĐ"}
        </button>
      </td>
    </tr>
  );
}

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
  const [isLoading, setIsLoading] = useState(false);

  // States chứa Data thật
  const [plans, setPlans]   = useState([]);
  const [commissionRules, setCommissionRules] = useState({});
  const [bonusRules, setBonusRules]           = useState({});
  const [barbers, setBarbers] = useState([]);

  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Modals
  const [planModal, setPlanModal]         = useState(null); 
  const [bonusModal, setBonusModal]       = useState(null); 
  const [contractModal, setContractModal] = useState(null); 
  const [showExpired, setShowExpired] = useState(false);

  // ─── INIT DATA: TẢI TỪ API ──────────────────────────────────────
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Lấy danh sách cấp bậc
      const plansRes = await HrPolicyAPI.getActivePlans();
      // Giả sử API trả về array trực tiếp hoặc nằm trong obj.data
      const plansData = plansRes.data || plansRes || [];
      setPlans(plansData);

      if (plansData.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansData[0].idCompensationPlan);
      }

      // 2. Lấy danh sách thợ & hợp đồng
      const barbersRes = await HrPolicyAPI.getBarbersContracts();
      const rawBarbers = barbersRes.data || barbersRes || [];
      
      // Map lại dữ liệu backend cho khớp với UI table
      const mappedBarbers = rawBarbers.map(b => {
        const activeContract = b.contracts?.find(c => c.status === 'active');
        return {
          idBarber: b.idBarber,
          name: b.user?.fullName || "Thợ chưa có tên",
          avatar: (b.user?.fullName || "T").charAt(0).toUpperCase(),
          branch: "Chi nhánh chính", // Mock tạm chi nhánh
          idSalaryContract: activeContract?.idSalaryContract,
          idCompensationPlan: activeContract?.idPlan,

          actualBaseSalary: activeContract?.actualBaseSalary,
          contractType: activeContract?.contractType,
          startDate: activeContract?.startDate,
          status: activeContract ? "active" : "no_contract"
        };
      });
      setBarbers(mappedBarbers);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // ─── TẢI LUẬT KHI CHỌN TAB 2 HOẶC ĐỔI CẤP ────────────────────────
  const loadRulesForPlan = async (idPlan) => {
    if (!idPlan) return;
    try {
      const data = await HrPolicyAPI.getRulesByPlan(idPlan);
      const payload = data.data || data; // handle axios response
      setCommissionRules(prev => ({ ...prev, [idPlan]: payload.commissionRules || [] }));
      setBonusRules(prev => ({ ...prev, [idPlan]: payload.bonusRules || [] }));
    } catch (error) {
      console.error("Lỗi tải luật:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "rules" && selectedPlanId) {
      loadRulesForPlan(selectedPlanId);
    }
  }, [activeTab, selectedPlanId]);

  // Derived state
  const activePlans  = plans.filter((p) => p.effectiveTo === null);
  const expiredPlans = plans.filter((p) => p.effectiveTo !== null);
  const selectedPlan = activePlans.find((p) => p.idCompensationPlan === selectedPlanId);

  // ─── API HANDLERS ───────────────────────────────────────────────
  const handleSavePlan = async (formData) => {
    try {
      await HrPolicyAPI.savePlan(formData);
      alert("Lưu chính sách cấp bậc thành công!");
      setPlanModal(null);
      loadInitialData(); // Refresh list
    } catch (error) {
      alert("Lỗi khi lưu cấp bậc: " + (error.message || ""));
    }
  };

  const handleSaveContract = async (formData) => {
    try {
      await HrPolicyAPI.assignContract(formData.idBarber, formData);
      alert("Cấp hợp đồng mới thành công!");
      setContractModal(null);
      loadInitialData(); // Refresh list
    } catch (error) {
      alert("Lỗi khi cấp hợp đồng: " + (error.message || ""));
    }
  };

  // UI Handlers cho Hoa Hồng (Tab 2) - Chỉ lưu local, bấm nút Lưu mới gọi API
  const handleAddCommissionRow = () => {
    const rules = commissionRules[selectedPlanId] || [];
    const lastRule = rules[rules.length - 1];
    const newRule = {
      tempId: Date.now(), // Fake ID để render
      minRevenueStep: lastRule?.maxRevenueStep || 0,
      maxRevenueStep: null,
      commissionRate: lastRule?.commissionRate || 15,
    };
    const updated = rules.map((r, i) =>
      i === rules.length - 1 ? { ...r, maxRevenueStep: newRule.minRevenueStep } : r
    );
    setCommissionRules(prev => ({ ...prev, [selectedPlanId]: [...updated, newRule] }));
  };

  const handleUpdateCommissionRow = (ruleId, updatedRule) => {
    setCommissionRules(prev => ({
      ...prev,
      [selectedPlanId]: prev[selectedPlanId].map(r => (r.idCommissionRule || r.tempId) === ruleId ? updatedRule : r),
    }));
  };

  const handleRemoveCommissionRow = (ruleId) => {
    const rules = commissionRules[selectedPlanId];
    if (rules.length <= 1) return;
    const filtered = rules.filter(r => (r.idCommissionRule || r.tempId) !== ruleId);
    const updated = filtered.map((r, i) => i === filtered.length - 1 ? { ...r, maxRevenueStep: null } : r);
    setCommissionRules(prev => ({ ...prev, [selectedPlanId]: updated }));
  };

  // GỌI API LƯU HOA HỒNG
  const submitCommissionRules = async () => {
    try {
      const rulesToSave = commissionRules[selectedPlanId] || [];
      await HrPolicyAPI.saveCommissionRules(selectedPlanId, rulesToSave);
      alert("Lưu bậc thang hoa hồng thành công!");
      loadRulesForPlan(selectedPlanId); // Refresh để lấy ID thật từ DB
    } catch (error) {
      alert("Lỗi lưu hoa hồng: " + (error.message || ""));
    }
  };

  // UI Handlers cho Thưởng (Tab 2) - Gọi API luôn cho chắc cú
  const handleSaveBonus = async (formData) => {
    try {
      const pid = formData.idCompensationPlan;
      const existing = bonusRules[pid] || [];
      let newRules;
      if (formData.idBonusRule) {
        newRules = existing.map(b => b.idBonusRule === formData.idBonusRule ? formData : b);
      } else {
        newRules = [...existing, formData];
      }
      await HrPolicyAPI.saveBonusRules(pid, newRules);
      alert("Cập nhật gói thưởng KPI thành công!");
      setBonusModal(null);
      loadRulesForPlan(pid);
    } catch (error) {
      alert("Lỗi khi lưu gói thưởng");
    }
  };

  const handleRemoveBonus = async (planId, bonusId) => {
    if(!window.confirm("Bạn có chắc chắn muốn xóa gói thưởng này?")) return;
    try {
      const newRules = (bonusRules[planId] || []).filter(b => b.idBonusRule !== bonusId);
      await HrPolicyAPI.saveBonusRules(planId, newRules);
      loadRulesForPlan(planId);
    } catch (error) {
      alert("Lỗi khi xóa gói thưởng");
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  if (isLoading && activeTab === "plans" && plans.length === 0) {
    return <div className={cx("loadingBox")}><Loader className="spin" /> Đang tải dữ liệu cấu hình...</div>;
  }

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

          <div className={cx("ladderCard")}>
            <div className={cx("ladderTitle")}>
              <TrendingUp size={15} /> Lộ trình thăng tiến tự động
            </div>
            <div className={cx("ladder")}>
              {activePlans.map((plan, i) => (
                <div key={plan.idCompensationPlan} className={cx("ladderStep")} style={{ "--step-color": plan.color || "#3b82f6" }}>
                  <div className={cx("ladderDot")} />
                  <div className={cx("ladderInfo")}>
                    <div className={cx("ladderPlanName")}>{plan.displayName}</div>
                    {plan.minRevenueToPromote ? (
                      <div className={cx("ladderRequire")}>
                        Đạt {fmt(plan.minRevenueToPromote / 1000000)}tr/tháng ×{plan.evaluationPeriodMonths} tháng
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
                    <PlanCard key={plan.idCompensationPlan} plan={plan} isSelected={false} onClick={() => {}} onEdit={() => {}} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2: RULES                                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === "rules" && (
        <div className={cx("tabContent")}>
          <div className={cx("rulesLayout")}>

            {/* Sidebar */}
            <div className={cx("planSelector")}>
              <div className={cx("planSelectorTitle")}>Chọn cấp bậc</div>
              {activePlans.map((plan) => (
                <button
                  key={plan.idCompensationPlan}
                  className={cx("planSelectorItem", { active: selectedPlanId === plan.idCompensationPlan })}
                  onClick={() => setSelectedPlanId(plan.idCompensationPlan)}
                  style={{ "--plan-color": plan.color || "#3b82f6" }}
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

            {/* Config Panel */}
            {selectedPlan && (
              <div className={cx("rulesPanel")}>

                {/* HH */}
                <div className={cx("rulesSection")}>
                  <div className={cx("rulesSectionHead")}>
                    <div className={cx("rulesSectionTitle")}>
                      <Percent size={15} /> Bậc thang Hoa hồng
                      <span className={cx("rulesPlanTag")} style={{ color: selectedPlan.color || "#3b82f6" }}>
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
                        key={rule.idCommissionRule || rule.tempId}
                        rule={rule}
                        index={i}
                        isLast={i === arr.length - 1}
                        onChange={(updated) => handleUpdateCommissionRow(rule.idCommissionRule || rule.tempId, updated)}
                        onRemove={handleRemoveCommissionRow}
                      />
                    ))}
                  </div>

                  <div className={cx("saveRow")}>
                    <button className={cx("saveBtn")} onClick={submitCommissionRules}>
                      <Save size={14} /> Lưu Cấu hình Hoa hồng
                    </button>
                  </div>
                </div>

                {/* KPI */}
                <div className={cx("rulesSection")}>
                  <div className={cx("rulesSectionHead")}>
                    <div className={cx("rulesSectionTitle")}>
                      <Trophy size={15} /> Thưởng KPI Combo
                      <span className={cx("rulesPlanTag")} style={{ color: selectedPlan.color || "#3b82f6" }}>
                        {selectedPlan.displayName}
                      </span>
                    </div>
                    <button className={cx("addRowBtn")} onClick={() => setBonusModal({ idCompensationPlan: selectedPlanId })}>
                      <Plus size={13} /> Thêm gói thưởng
                    </button>
                  </div>

                  <div className={cx("bonusNote")}>
                    <AlertTriangle size={13} /> Thợ phải đạt <strong>CẢ HAI</strong> điều kiện mới nhận thưởng.
                  </div>

                  <div className={cx("bonusCards")}>
                    {(bonusRules[selectedPlanId] || []).length === 0 ? (
                      <div className={cx("emptyHint")}>Chưa có gói thưởng nào.</div>
                    ) : (
                      (bonusRules[selectedPlanId] || []).map((bonus) => (
                        <BonusCard
                          key={bonus.idBonusRule}
                          bonus={bonus}
                          onEdit={(b) => setBonusModal({ idCompensationPlan: selectedPlanId, bonus: b })}
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
        </div>
      )}

      {/* MODALS */}
      {planModal !== null && (
        <PlanModal plan={planModal} activePlans={activePlans} onSave={handleSavePlan} onClose={() => setPlanModal(null)} />
      )}
      {bonusModal !== null && (
        <BonusModal data={bonusModal} onSave={handleSaveBonus} onClose={() => setBonusModal(null)} />
      )}
      {contractModal !== null && (
        <ContractModal barber={contractModal} plans={activePlans} onSave={handleSaveContract} onClose={() => setContractModal(null)} />
      )}
    </div>
  );
}

// ─── Plan Modal ───────────────────────────────────────────────────
function PlanModal({ plan, activePlans, onSave, onClose }) {
  const isEdit = !!plan.idCompensationPlan;
  const [form, setForm] = useState({
    idCompensationPlan: plan.idCompensationPlan || null,
    roleType: plan.roleType || "",
    displayName: plan.displayName || "",
    defaultBaseSalary: plan.defaultBaseSalary || 3000000,
    minRevenueToPromote: plan.minRevenueToPromote || "",
    evaluationPeriodMonths: plan.evaluationPeriodMonths || 1,
    minMonthsInLevel: plan.minMonthsInLevel || 0,
    effectiveFrom: plan.effectiveFrom || new Date().toISOString().split("T")[0],
    color: plan.color || "#3b82f6" // Frontend only attr
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open title={isEdit ? "Chỉnh sửa cấp bậc" : "Thêm cấp bậc mới"} subtitle={isEdit ? plan.displayName : "Tạo cấp bậc nhân sự mới"} onClose={onClose}>
      <div className={cx("formGrid")}>
        <Field label="Tên hiển thị" required>
          <input className={cx("input")} value={form.displayName} onChange={(e) => upd("displayName", e.target.value)} placeholder="VD: Thợ Junior" />
        </Field>
        <Field label="Mã hệ thống (roleType)" required>
          <input className={cx("input")} value={form.roleType} onChange={(e) => upd("roleType", e.target.value)} placeholder="junior / senior / master" disabled={isEdit}/>
        </Field>
        <Field label="Lương cứng mặc định (đ)" required>
          <input className={cx("input")} type="number" value={form.defaultBaseSalary} onChange={(e) => upd("defaultBaseSalary", Number(e.target.value))} />
        </Field>
        <Field label="Ngày áp dụng từ" required>
          <input className={cx("input")} type="date" value={form.effectiveFrom} onChange={(e) => upd("effectiveFrom", e.target.value)} />
        </Field>
        <Field label="Doanh thu tối thiểu để thăng cấp (đ)">
          <input className={cx("input")} type="number" value={form.minRevenueToPromote} onChange={(e) => upd("minRevenueToPromote", e.target.value ? Number(e.target.value) : "")} />
        </Field>
        <Field label="Số tháng đánh giá KPI">
          <input className={cx("input")} type="number" min="1" value={form.evaluationPeriodMonths} onChange={(e) => upd("evaluationPeriodMonths", Number(e.target.value))} />
        </Field>
      </div>

      <div className={cx("modalFooter")}>
        <button className={cx("btn", "ghost")} onClick={onClose}>Huỷ</button>
        <button className={cx("btn", "primary")} onClick={() => onSave(form)}>Lưu cấp bậc</button>
      </div>
    </Modal>
  );
}

// ─── Bonus Modal ──────────────────────────────────────────────────
function BonusModal({ data, onSave, onClose }) {
  const isEdit = !!data.bonus;
  const [form, setForm] = useState({
    idBonusRule: data.bonus?.idBonusRule || null,
    idCompensationPlan: data.idCompensationPlan,
    bonusName: data.bonus?.bonusName || "",
    minCustomerCount: data.bonus?.minCustomerCount || 200,
    minAverageRating: data.bonus?.minAverageRating || 4.5,
    evaluationPeriodMonths: data.bonus?.evaluationPeriodMonths || 1,
    rewardAmount: data.bonus?.rewardAmount || 500000,
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open title={isEdit ? "Chỉnh sửa gói thưởng" : "Thêm gói thưởng KPI"} onClose={onClose}>
      <div className={cx("formGrid")}>
        <Field label="Tên gói thưởng" required>
          <input className={cx("input")} value={form.bonusName} onChange={(e) => upd("bonusName", e.target.value)} />
        </Field>
        <Field label="Số khách tối thiểu" required>
          <input className={cx("input")} type="number" value={form.minCustomerCount} onChange={(e) => upd("minCustomerCount", Number(e.target.value))} />
        </Field>
        <Field label="Rating tối thiểu (1-5)" required>
          <input className={cx("input")} type="number" step="0.1" value={form.minAverageRating} onChange={(e) => upd("minAverageRating", Number(e.target.value))} />
        </Field>
        <Field label="Tiền thưởng (đ)" required>
          <input className={cx("input")} type="number" value={form.rewardAmount} onChange={(e) => upd("rewardAmount", Number(e.target.value))} />
        </Field>
      </div>
      <div className={cx("modalFooter")}>
        <button className={cx("btn", "ghost")} onClick={onClose}>Huỷ</button>
        <button className={cx("btn", "primary")} onClick={() => onSave(form)}>Lưu gói thưởng</button>
      </div>
    </Modal>
  );
}

// ─── Contract Modal ───────────────────────────────────────────────
function ContractModal({ barber, plans, onSave, onClose }) {
  const [form, setForm] = useState({
    idBarber: barber.idBarber,
    idCompensationPlan: barber.idCompensationPlan || plans[0]?.idCompensationPlan || "",
    actualBaseSalary: barber.actualBaseSalary || plans[0]?.defaultBaseSalary || 0,
    contractType: barber.contractType || "full_time",
    startDate: barber.startDate || new Date().toISOString().split("T")[0],
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedPlan = plans.find((p) => p.idCompensationPlan === Number(form.idCompensationPlan));

  const handlePlanChange = (pid) => {
    const plan = plans.find((p) => p.idCompensationPlan === Number(pid));
    setForm((f) => ({ ...f, idCompensationPlan: Number(pid), actualBaseSalary: plan?.defaultBaseSalary || f.actualBaseSalary }));
  };

  return (
    <Modal open title={barber.idSalaryContract ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng mới"} subtitle={barber.name} onClose={onClose}>
      <div className={cx("formGrid")}>
        <Field label="Cấp bậc" required>
          <select className={cx("input", "select")} value={form.idCompensationPlan} onChange={(e) => handlePlanChange(e.target.value)}>
            <option value="">-- Chọn cấp bậc --</option>
            {plans.map((p) => <option key={p.idCompensationPlan} value={p.idCompensationPlan}>{p.displayName}</option>)}
          </select>
        </Field>
        <Field label="Loại hợp đồng" required>
          <select className={cx("input", "select")} value={form.contractType} onChange={(e) => upd("contractType", e.target.value)}>
            <option value="probation">Thử việc</option>
            <option value="full_time">Chính thức</option>
            <option value="part_time">Bán thời gian</option>
          </select>
        </Field>
        <Field label="Lương cứng thực tế (đ)">
          <input className={cx("input")} type="number" value={form.actualBaseSalary} onChange={(e) => upd("actualBaseSalary", Number(e.target.value))} />
        </Field>
        <Field label="Ngày bắt đầu" required>
          <input className={cx("input")} type="date" value={form.startDate} onChange={(e) => upd("startDate", e.target.value)} />
        </Field>
      </div>

      <div className={cx("modalFooter")}>
        <button className={cx("btn", "ghost")} onClick={onClose}>Huỷ</button>
        <button className={cx("btn", "primary")} onClick={() => onSave(form)}>Lưu hợp đồng</button>
      </div>
    </Modal>
  );
}

export default ChinhSach;
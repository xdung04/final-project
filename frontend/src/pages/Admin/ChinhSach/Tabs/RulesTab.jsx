import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import styles from "../ChinhSach.module.scss";
import {
  Percent, Trophy, Plus, Trash2, Edit3,
  ChevronRight, ArrowRight, Users, Star,
  Calendar, DollarSign, Save, X, AlertTriangle, Copy
} from "lucide-react";
import { HrPolicyAPI } from "~/apis/hrPolicyAPI";

const cx = classNames.bind(styles);

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

// ─── CommissionRow ────────────────────────────────────────────────
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

// ─── BonusCard ────────────────────────────────────────────────────
function BonusCard({ bonus, onEdit, onRemove }) {
  return (
    <div className={cx("bonusCard")}>
      <div className={cx("bonusCardHead")}>
        <div className={cx("bonusName")}>
          <Trophy size={14} /> {bonus.bonusName}
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

// ─── BonusModal ───────────────────────────────────────────────────
// Đẩy ra document.body bằng createPortal để không bị khung tab "nhốt" lại
function BonusModal({ data, onSave, onClose }) {
  const isEdit = !!data.bonus;
  const [form, setForm] = useState({
    idBonusRule:            data.bonus?.idBonusRule || null,
    idCompensationPlan:     data.idCompensationPlan,
    bonusName:              data.bonus?.bonusName || "",
    minCustomerCount:       data.bonus?.minCustomerCount || 200,
    minAverageRating:       data.bonus?.minAverageRating || 4.5,
    evaluationPeriodMonths: data.bonus?.evaluationPeriodMonths || 1,
    rewardAmount:           data.bonus?.rewardAmount || 500000,
  });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return createPortal(
    <div className={cx("modalOverlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modalBox")}>
        <div className={cx("modalHeader")}>
          <div>
            <div className={cx("modalTitle")}>{isEdit ? "Chỉnh sửa gói thưởng" : "Thêm gói thưởng KPI"}</div>
          </div>
          <button className={cx("modalCloseBtn")} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={cx("modalBody")}>
          <div className={cx("formGrid")}>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Tên gói thưởng <span className={cx("required")}>*</span></label>
              <input className={cx("input")} value={form.bonusName}
                onChange={(e) => upd("bonusName", e.target.value)} />
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Số khách tối thiểu <span className={cx("required")}>*</span></label>
              <input className={cx("input")} type="number" value={form.minCustomerCount}
                onChange={(e) => upd("minCustomerCount", Number(e.target.value))} />
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Rating tối thiểu (1-5) <span className={cx("required")}>*</span></label>
              <input className={cx("input")} type="number" step="0.1" value={form.minAverageRating}
                onChange={(e) => upd("minAverageRating", Number(e.target.value))} />
            </div>
            <div className={cx("field")}>
              <label className={cx("fieldLabel")}>Tiền thưởng (đ) <span className={cx("required")}>*</span></label>
              <input className={cx("input")} type="number" value={form.rewardAmount}
                onChange={(e) => upd("rewardAmount", Number(e.target.value))} />
            </div>
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
        </div>

        <div className={cx("modalFooter")}>
          <button className={cx("btn", "ghost")} onClick={onClose}><X size={14} /> Huỷ</button>
          <button className={cx("btn", "primary")} onClick={() => onSave(form)}>
            <Save size={14} /> {isEdit ? "Cập nhật" : "Lưu gói thưởng"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── LockedPlanBanner ─────────────────────────────────────────────
// Hiển thị khi Plan đã bị lock (409) — hướng dẫn clone
function LockedPlanBanner({ planName, onClone, isCloning }) {
  return (
    <div className={cx("lockedBanner")}>
      <AlertTriangle size={16} />
      <div className={cx("lockedBannerText")}>
        <strong>Không thể chỉnh sửa rules của "{planName}"</strong>
        <span>Plan này đã được dùng để tính lương. Tạo bản sao để chỉnh sửa rules mới.</span>
      </div>
      <button
        className={cx("btn", "warning", "small")}
        onClick={onClone}
        disabled={isCloning}
      >
        <Copy size={13} />
        {isCloning ? "Đang tạo..." : "Tạo bản sao Plan"}
      </button>
    </div>
  );
}

// ─── RulesTab ─────────────────────────────────────────────────────
function RulesTab({ activePlans, onReload }) {
  const [selectedPlanId,  setSelectedPlanId]  = useState(activePlans[0]?.idCompensationPlan || null);
  const [commissionRules, setCommissionRules]  = useState({});
  const [bonusRules,      setBonusRules]       = useState({});
  const [bonusModal,      setBonusModal]       = useState(null);
  // lockedPlanIds: Set các Plan đã bị backend block 409
  const [lockedPlanIds,   setLockedPlanIds]    = useState(new Set());
  const [isCloning,       setIsCloning]        = useState(false);

  const selectedPlan = activePlans.find((p) => p.idCompensationPlan === selectedPlanId);
  const isSelectedLocked = lockedPlanIds.has(selectedPlanId);

  // Load rules mỗi khi đổi plan
  const loadRulesForPlan = async (idPlan) => {
    if (!idPlan) return;
    try {
      const data    = await HrPolicyAPI.getRulesByPlan(idPlan);
      const payload = data.data || data;
      setCommissionRules((prev) => ({ ...prev, [idPlan]: payload.commissionRules || [] }));
      setBonusRules((prev)      => ({ ...prev, [idPlan]: payload.bonusRules      || [] }));
    } catch (err) {
      console.error("Lỗi tải luật:", err);
    }
  };

  useEffect(() => {
    if (selectedPlanId) loadRulesForPlan(selectedPlanId);
  }, [selectedPlanId]);

  // ── Helper: Xử lý lỗi 409 từ backend ────────────────────────
  // Khi backend trả 409 → đánh dấu plan bị lock, không hỏi confirm nữa
  const handleRulesSaveError = (err) => {
    const isLocked = err?.status === 409 || err?.message?.includes("đã được dùng để tính lương");
    if (isLocked) {
      setLockedPlanIds((prev) => new Set([...prev, selectedPlanId]));
    } else {
      alert("Lỗi lưu: " + (err.message || "Không xác định"));
    }
  };

  // ── Clone Plan ────────────────────────────────────────────────
  const handleClonePlan = async () => {
    const confirmed = window.confirm(
      `Tạo bản sao của "${selectedPlan?.displayName}"?\n\n` +
      `Bản sao sẽ chứa toàn bộ rules hiện tại và có thể chỉnh sửa tự do.\n` +
      `Barber muốn áp dụng rules mới cần được ký lại hợp đồng với Plan bản sao.`
    );
    if (!confirmed) return;

    setIsCloning(true);
    try {
      const res = await HrPolicyAPI.clonePlan(selectedPlanId);
      const newPlan = res.data || res;
      alert(`Đã tạo bản sao "${newPlan.displayName}" thành công!\nBây giờ bạn có thể chỉnh sửa rules trên Plan mới.`);
      // Xóa lock của plan cũ (nếu có) vì người dùng đã được hướng dẫn
      setLockedPlanIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedPlanId);
        return next;
      });
      onReload(); // Reload để thấy Plan mới trong sidebar
    } catch (err) {
      alert("Lỗi tạo bản sao: " + (err.message || ""));
    } finally {
      setIsCloning(false);
    }
  };

  // ── Commission handlers ────────────────────────────────────────
  const handleAddCommissionRow = () => {
    const rules   = commissionRules[selectedPlanId] || [];
    const last    = rules[rules.length - 1];
    const newRule = {
      tempId:             Date.now(),
      idCompensationPlan: selectedPlanId,
      minRevenueStep:     last?.maxRevenueStep || 0,
      maxRevenueStep:     null,
      commissionRate:     last?.commissionRate || 15,
    };
    const updated = rules.map((r, i) =>
      i === rules.length - 1 ? { ...r, maxRevenueStep: newRule.minRevenueStep } : r
    );
    setCommissionRules((prev) => ({ ...prev, [selectedPlanId]: [...updated, newRule] }));
  };

  const handleUpdateCommissionRow = (ruleId, updatedRule) => {
    setCommissionRules((prev) => ({
      ...prev,
      [selectedPlanId]: prev[selectedPlanId].map((r) =>
        (r.idCommissionRule || r.tempId) === ruleId ? updatedRule : r
      ),
    }));
  };

  const handleRemoveCommissionRow = (ruleId) => {
    const rules = commissionRules[selectedPlanId];
    if (rules.length <= 1) return;
    const filtered = rules.filter((r) => (r.idCommissionRule || r.tempId) !== ruleId);
    const updated  = filtered.map((r, i) =>
      i === filtered.length - 1 ? { ...r, maxRevenueStep: null } : r
    );
    setCommissionRules((prev) => ({ ...prev, [selectedPlanId]: updated }));
  };

  const submitCommissionRules = async () => {
    try {
      await HrPolicyAPI.saveCommissionRules(selectedPlanId, commissionRules[selectedPlanId] || []);
      alert("Lưu bậc thang hoa hồng thành công!");
      loadRulesForPlan(selectedPlanId);
    } catch (err) {
      // ✅ 409 → hiện banner clone thay vì alert chung chung
      handleRulesSaveError(err);
    }
  };

  // ── Bonus handlers ─────────────────────────────────────────────
  const handleSaveBonus = async (formData) => {
    try {
      const pid      = formData.idCompensationPlan;
      const existing = bonusRules[pid] || [];
      const newRules = formData.idBonusRule
        ? existing.map((b) => b.idBonusRule === formData.idBonusRule ? formData : b)
        : [...existing, formData];
      await HrPolicyAPI.saveBonusRules(pid, newRules);
      alert("Cập nhật gói thưởng KPI thành công!");
      setBonusModal(null);
      loadRulesForPlan(pid);
    } catch (err) {
      setBonusModal(null);
      // ✅ 409 → hiện banner clone thay vì alert chung chung
      handleRulesSaveError(err);
    }
  };

  const handleRemoveBonus = async (planId, bonusId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói thưởng này?")) return;
    try {
      const newRules = (bonusRules[planId] || []).filter((b) => b.idBonusRule !== bonusId);
      await HrPolicyAPI.saveBonusRules(planId, newRules);
      loadRulesForPlan(planId);
    } catch (err) {
      handleRulesSaveError(err);
    }
  };

  return (
    <div className={cx("tabContent")}>
      <div className={cx("rulesLayout")}>

        {/* Plan selector sidebar */}
        <div className={cx("planSelector")}>
          <div className={cx("planSelectorTitle")}>Chọn cấp bậc</div>
          {activePlans.map((plan) => (
            <button
              key={plan.idCompensationPlan}
              className={cx("planSelectorItem", {
                active: selectedPlanId === plan.idCompensationPlan,
                locked: lockedPlanIds.has(plan.idCompensationPlan),
              })}
              onClick={() => setSelectedPlanId(plan.idCompensationPlan)}
              style={{ "--plan-color": plan.color || "#3b82f6" }}
            >
              <div className={cx("planSelectorDot")} />
              <div>
                <div className={cx("planSelectorName")}>
                  {plan.displayName}
                  {/* Hiện icon khóa nhỏ nếu plan bị lock */}
                  {lockedPlanIds.has(plan.idCompensationPlan) && (
                    <AlertTriangle size={11} style={{ marginLeft: 4, color: "#f59e0b" }} />
                  )}
                </div>
                <div className={cx("planSelectorBase")}>{fmt(plan.defaultBaseSalary)}đ cứng</div>
              </div>
              <ChevronRight size={14} className={cx("planSelectorArrow")} />
            </button>
          ))}
        </div>

        {/* Config panel */}
        {selectedPlan && (
          <div className={cx("rulesPanel")}>

            {/* ✅ Banner cảnh báo lock — chỉ hiện khi plan bị lock */}
            {isSelectedLocked && (
              <LockedPlanBanner
                planName={selectedPlan.displayName}
                onClone={handleClonePlan}
                isCloning={isCloning}
              />
            )}

            {/* Hoa hồng */}
            <div className={cx("rulesSection")}>
              <div className={cx("rulesSectionHead")}>
                <div className={cx("rulesSectionTitle")}>
                  <Percent size={15} /> Bậc thang Hoa hồng
                  <span className={cx("rulesPlanTag")} style={{ color: selectedPlan.color || "#3b82f6" }}>
                    {selectedPlan.displayName}
                  </span>
                </div>
                {/* Ẩn nút thêm bậc khi plan đang bị lock */}
                {!isSelectedLocked && (
                  <button className={cx("addRowBtn")} onClick={handleAddCommissionRow}>
                    <Plus size={13} /> Thêm bậc
                  </button>
                )}
              </div>

              <div className={cx("commHeader")}>
                <span>Khoảng doanh thu</span>
                <span>Tỷ lệ %</span>
              </div>

              <div className={cx("commRows")}>
                {(commissionRules[selectedPlanId] || []).map((rule, i, arr) => (
                  <CommissionRow
                    key={rule.idCommissionRule || rule.tempId}
                    rule={rule} index={i} isLast={i === arr.length - 1}
                    onChange={(updated) => handleUpdateCommissionRow(rule.idCommissionRule || rule.tempId, updated)}
                    onRemove={handleRemoveCommissionRow}
                  />
                ))}
              </div>

              <div className={cx("commPreview")}>
                <div className={cx("commPreviewTitle")}>Ví dụ tính toán</div>
                {(commissionRules[selectedPlanId] || []).map((rule) => {
                  const exRev = Number(rule.minRevenueStep) + (rule.maxRevenueStep
                    ? (Number(rule.maxRevenueStep) - Number(rule.minRevenueStep)) / 2
                    : 10000000);
                  const earn = exRev * Number(rule.commissionRate) / 100;
                  return (
                    <div key={rule.idCommissionRule || rule.tempId} className={cx("commPreviewRow")}>
                      <span>DT {fmt(Math.round(exRev / 1000000))}tr</span>
                      <span className={cx("previewArrow")}>→</span>
                      <span className={cx("previewRate")}>{rule.commissionRate}%</span>
                      <span className={cx("previewEarn")}>= {fmt(Math.round(earn))}đ HH</span>
                    </div>
                  );
                })}
              </div>

              <div className={cx("saveRow")}>
                <button
                  className={cx("saveBtn", { disabled: isSelectedLocked })}
                  onClick={submitCommissionRules}
                  disabled={isSelectedLocked}
                  title={isSelectedLocked ? "Plan đang bị lock — hãy tạo bản sao để chỉnh sửa" : ""}
                >
                  <Save size={14} /> Lưu Hoa hồng
                </button>
              </div>
            </div>

            {/* Thưởng KPI */}
            <div className={cx("rulesSection")}>
              <div className={cx("rulesSectionHead")}>
                <div className={cx("rulesSectionTitle")}>
                  <Trophy size={15} /> Thưởng KPI Combo
                  <span className={cx("rulesPlanTag")} style={{ color: selectedPlan.color || "#3b82f6" }}>
                    {selectedPlan.displayName}
                  </span>
                </div>
                {!isSelectedLocked && (
                  <button className={cx("addRowBtn")} onClick={() => setBonusModal({ idCompensationPlan: selectedPlanId })}>
                    <Plus size={13} /> Thêm gói thưởng
                  </button>
                )}
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
                      key={bonus.idBonusRule} bonus={bonus}
                      onEdit={isSelectedLocked ? () => {} : (b) => setBonusModal({ idCompensationPlan: selectedPlanId, bonus: b })}
                      onRemove={isSelectedLocked ? () => {} : (id) => handleRemoveBonus(selectedPlanId, id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {bonusModal !== null && (
        <BonusModal data={bonusModal} onSave={handleSaveBonus} onClose={() => setBonusModal(null)} />
      )}
    </div>
  );
}

export default RulesTab;
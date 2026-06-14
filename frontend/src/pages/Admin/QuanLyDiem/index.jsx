import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./QuanLyDiem.module.scss";
import { Plus, RefreshCw, Award } from "lucide-react";
import { LoyaltyRuleAPI } from "~/apis/loyaltyRuleAPI";
import LoyaltyRuleCard from "~/components/LoyaltyRuleCard";
import CreateRuleModal from "~/components/CreateRuleModal";

const cx = classNames.bind(styles);

export default function QuanLyDiem() {
  const [rules, setRules]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await LoyaltyRuleAPI.getAll();
      setRules(data);
    } catch (error) {
      console.error("Lỗi load loyalty rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (ruleData) => {
    try {
      if (editingRule) {
        const updated = await LoyaltyRuleAPI.update(editingRule.id, ruleData);
        setRules((prev) => prev.map((r) => (r.id === editingRule.id ? updated : r)));
      } else {
        const created = await LoyaltyRuleAPI.create(ruleData);
        setRules((prev) => [...prev, created]);
      }
      setShowModal(false);
      setEditingRule(null);
    } catch (error) {
      console.error("Lỗi lưu rule:", error);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await LoyaltyRuleAPI.delete(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Lỗi xoá rule:", error);
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  if (loading) return <div className={cx("loading")}>Đang tải dữ liệu...</div>;

  return (
    <div className={cx("quanLyDiem")}>

      {/* ── PAGE HEADING ──────────────────────────────────────────────── */}
      <div className={cx("pageHead")}>
        <div>
          <p className={cx("pageHead__eyebrow")}>Quản lý khách hàng</p>
          <h2 className={cx("pageHead__title")}>
            Chính sách <em>Tích điểm</em>
          </h2>
        </div>
        <div className={cx("pageHead__actions")}>
          <button className={cx("refreshButton")} onClick={fetchRules} title="Làm mới">
            <RefreshCw size={14} strokeWidth={2} />
          </button>
          <button
            className={cx("addButton")}
            onClick={() => { setEditingRule(null); setShowModal(true); }}
          >
            <Plus size={15} strokeWidth={2} /> Tạo quy tắc
          </button>
        </div>
      </div>

      {/* ── SECTION CARD ──────────────────────────────────────────────── */}
      <div className={cx("sectionCard")}>

        {/* Dark header */}
        <div className={cx("sectionHead")}>
          <div className={cx("sectionHead__left")}>
            <Award size={16} strokeWidth={1.5} className={cx("sectionHead__icon")} />
            <span className={cx("sectionHead__title")}>Quy tắc tích điểm</span>
          </div>
          <span className={cx("sectionHead__count")}>
            {rules.length} quy tắc
          </span>
        </div>

        {/* Rule list */}
        <div className={cx("ruleList")}>
          {rules.length > 0 ? (
            rules.map((rule) => (
              <LoyaltyRuleCard
                key={rule.id}
                rule={rule}
                onEdit={() => handleEditRule(rule)}
                onDelete={() => handleDeleteRule(rule.id)}
              />
            ))
          ) : (
            <div className={cx("empty")}>Chưa có quy tắc tích điểm nào</div>
          )}
        </div>
      </div>

      {/* ── MODAL ─────────────────────────────────────────────────────── */}
      {showModal && (
        <CreateRuleModal
          initialData={editingRule}
          onClose={() => { setShowModal(false); setEditingRule(null); }}
          onCreate={handleSaveRule}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./QuanLyDiem.module.scss";
import { Plus, RefreshCw, Award } from "lucide-react";
import { LoyaltyRuleAPI } from "~/apis/loyaltyRuleAPI";
import LoyaltyRuleCard from "~/components/LoyaltyRuleCard";
import CreateRuleModal from "~/components/CreateRuleModal";
import { useToast } from "~/context/ToastContext"; // Sử dụng Toast toàn cục

const cx = classNames.bind(styles);

export default function QuanLyDiem() {
  const { showToast } = useToast(); // Hook dùng chung cho cả app
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await LoyaltyRuleAPI.getAll();
      setRules(data);
    } catch (error) {
      console.error("Lỗi load loyalty rules:", error);
      showToast({ type: "error", text: "Không thể tải danh sách quy tắc." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (ruleData) => {
    try {
      if (editingRule) {
        await LoyaltyRuleAPI.update(editingRule.id, ruleData);
        showToast({ type: "success", text: "Cập nhật quy tắc thành công!" });
      } else {
        await LoyaltyRuleAPI.create(ruleData);
        showToast({ type: "success", text: "Tạo quy tắc thành công!" });
      }
      
      await fetchRules(); // Reload lại danh sách sau khi lưu
      setShowModal(false);
      setEditingRule(null);
      return true; 
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Có lỗi xảy ra!";
      showToast({ type: "error", text: msg }); // Truyền object chuẩn theo ToastContext
      return false;
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await LoyaltyRuleAPI.delete(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      showToast({ type: "success", text: "Đã xoá quy tắc thành công." });
    } catch (error) {
      showToast({ type: "error", text: error.message || "Không thể xoá quy tắc." });
    }
  };

  if (loading) return <div className={cx("loading")}>Đang tải dữ liệu...</div>;

  return (
    <div className={cx("quanLyDiem")}>
      {/* Page Heading */}
      <div className={cx("pageHead")}>
        <div>
          <p className={cx("pageHead__eyebrow")}>Quản lý khách hàng</p>
          <h2 className={cx("pageHead__title")}>Chính sách <em>Tích điểm</em></h2>
        </div>
        <div className={cx("pageHead__actions")}>
          <button className={cx("refreshButton")} onClick={fetchRules}><RefreshCw size={14} /></button>
          <button className={cx("addButton")} onClick={() => { setEditingRule(null); setShowModal(true); }}>
            <Plus size={15} /> Tạo quy tắc
          </button>
        </div>
      </div>

      {/* Section Card */}
      <div className={cx("sectionCard")}>
        <div className={cx("sectionHead")}>
          <div className={cx("sectionHead__left")}>
            <Award size={16} className={cx("sectionHead__icon")} />
            <span className={cx("sectionHead__title")}>Quy tắc tích điểm</span>
          </div>
          <span className={cx("sectionHead__count")}>{rules.length} quy tắc</span>
        </div>

        <div className={cx("ruleList")}>
          {rules.length > 0 ? (
            rules.map((rule) => (
              <LoyaltyRuleCard
                key={rule.id}
                rule={rule}
                onEdit={() => { setEditingRule(rule); setShowModal(true); }}
                onDelete={() => handleDeleteRule(rule.id)}
              />
            ))
          ) : (
            <div className={cx("empty")}>Chưa có quy tắc tích điểm nào</div>
          )}
        </div>
      </div>

      {/* Modal */}
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
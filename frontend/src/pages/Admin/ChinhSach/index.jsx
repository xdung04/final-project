import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./ChinhSach.module.scss";
import { Layers, Percent, FileText, Loader } from "lucide-react";

import { HrPolicyAPI } from "~/apis/hrPolicyAPI";

// 3 tab components
import PlansTab     from "./Tabs/PlansTab";
import RulesTab     from "./Tabs/RulesTab";
import ContractsTab from "./Tabs/ContractsTab";

const cx = classNames.bind(styles);

const TABS = [
  { id: "plans",     label: "Cấp bậc",           icon: Layers   },
  { id: "rules",     label: "Hoa hồng & Thưởng",  icon: Percent  },
  { id: "contracts", label: "Hợp đồng",            icon: FileText },
];

const PLAN_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

function ChinhSach() {
  const [activeTab,   setActiveTab]   = useState("plans");
  const [isLoading,   setIsLoading]   = useState(true);
  const [plans,       setPlans]       = useState([]);
  const [barbers,     setBarbers]     = useState([]);

  // ── Load tất cả data ban đầu ──────────────────────────────────
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, barbersRes] = await Promise.all([
        HrPolicyAPI.getActivePlans(),
        HrPolicyAPI.getBarbersContracts(),
      ]);

      // Plans — gắn màu tạm nếu DB không lưu
      const plansData = plansRes.data || plansRes || [];
      const plansWithColors = plansData.map((p, i) => ({
        ...p,
        color: p.color || PLAN_COLORS[i % PLAN_COLORS.length],
      }));
      setPlans(plansWithColors);

      // Barbers — map contract active
      const rawBarbers = barbersRes.data || barbersRes || [];
      const mappedBarbers = rawBarbers.map((b) => {
        const activeContract = b.contracts?.find((c) => c.status === "active");
        return {
          idBarber:           b.idBarber,
          name:               b.user?.fullName || "Thợ chưa có tên",
          avatar:             (b.user?.fullName || "T").charAt(0).toUpperCase(),
          branch:             "Chi nhánh chính",
          idSalaryContract:   activeContract?.idSalaryContract,
          idCompensationPlan: activeContract?.idCompensationPlan,
          actualBaseSalary:   activeContract?.actualBaseSalary,
          contractType:       activeContract?.contractType,
          startDate:          activeContract?.startDate,
          status:             activeContract ? "active" : "no_contract",
        };
      });
      setBarbers(mappedBarbers);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // ── Callback cho PlansTab khi lưu plan ───────────────────────
  const handleSavePlan = async (formData) => {
    try {
      await HrPolicyAPI.savePlan(formData);
      alert("Lưu chính sách cấp bậc thành công!");
      loadInitialData();
    } catch (err) {
      alert("Lỗi khi lưu cấp bậc: " + (err.message || ""));
    }
  };

  const activePlans = plans.filter((p) => p.effectiveTo === null);

  // ── Loading screen ────────────────────────────────────────────
  if (isLoading && plans.length === 0) {
    return (
      <div className={cx("page")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Loader size={20} className={cx("spin")} />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
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
      </div>

      {/* ── Tab Bar ── */}
      <div className={cx("tabs")}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={cx("tab", { active: activeTab === tab.id })}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "plans" && (
        <PlansTab
          plans={plans}
          onSavePlan={handleSavePlan}
          onReload={loadInitialData}
        />
      )}

      {activeTab === "rules" && (
        <RulesTab
          activePlans={activePlans}
        />
      )}

      {activeTab === "contracts" && (
        <ContractsTab
          barbers={barbers}
          activePlans={activePlans}
          onReload={loadInitialData}
        />
      )}
    </div>
  );
}

export default ChinhSach;
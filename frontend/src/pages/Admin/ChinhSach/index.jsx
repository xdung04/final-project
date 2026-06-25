import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./ChinhSach.module.scss";
import { Layers, Percent, FileText, Loader } from "lucide-react";

import { HrPolicyAPI } from "~/apis/hrPolicyAPI";

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

// ChinhSach.jsx — sửa lại

function ChinhSach() {
  const [activeTab,      setActiveTab]      = useState("plans");
  const [isLoading,      setIsLoading]      = useState(true);
  const [plans,          setPlans]          = useState([]);
  const [barbers,        setBarbers]        = useState([]);
  const [promotionList,  setPromotionList]  = useState([]); // ✅ thêm

  // ✅ salaryPeriod = tháng vừa rồi (kỳ lương gần nhất có thể confirm)
  const getSalaryPeriod = () => {
    const d = new Date();
    const month = d.getMonth(); // tháng hiện tại - 1 (vì getMonth() từ 0)
    const year  = month === 0 ? d.getFullYear() - 1 : d.getFullYear();
    return { month: month === 0 ? 12 : month, year };
  };

 const loadInitialData = async () => {
  setIsLoading(true);
  try {
    const [plansRes, barbersRes, promotionRes] = await Promise.all([
      HrPolicyAPI.getActivePlans(),
      HrPolicyAPI.getBarbersContracts(),
      HrPolicyAPI.getPromotionAlerts(),
    ]);

    // ===== 1) Plans =====
    const plansData = plansRes.data || plansRes || [];
    const plansWithColors = plansData.map((p, i) => ({
      ...p,
      color: p.color || PLAN_COLORS[i % PLAN_COLORS.length],
    }));
    setPlans(plansWithColors);

    // ===== 2) Helper chọn contract để hiển thị =====
    const pickDisplayContract = (contracts = []) => {
      if (!Array.isArray(contracts) || contracts.length === 0) return null;

      const priority = {
        pending: 4,
        active: 3,
        closed: 2,
        terminated: 1,
      };

      return [...contracts].sort((a, b) => {
        const statusA = (a?.status || "").toLowerCase();
        const statusB = (b?.status || "").toLowerCase();

        const pa = priority[statusA] || 0;
        const pb = priority[statusB] || 0;

        // Ưu tiên status quan trọng hơn trước
        if (pb !== pa) return pb - pa;

        // Nếu cùng status thì ưu tiên contract mới hơn
        const dateA = new Date(a?.startDate || 0).getTime();
        const dateB = new Date(b?.startDate || 0).getTime();
        return dateB - dateA;
      })[0];
    };

    // ===== 3) Map barbers =====
    const rawBarbers = barbersRes.data || barbersRes || [];

    const mappedBarbers = rawBarbers.map((b) => {
      const displayContract = pickDisplayContract(b.contracts);

      return {
        idBarber: b.idBarber,
        name: b.user?.fullName || "Thợ chưa có tên",
        avatar: (b.user?.fullName || "T").charAt(0).toUpperCase(),
        branch: b.branch?.name || "Chi nhánh chính",

        // contract đang dùng để HIỂN THỊ ở UI
        idSalaryContract: displayContract?.idSalaryContract ?? null,
        idCompensationPlan: displayContract?.idCompensationPlan ?? null,
        actualBaseSalary: displayContract?.actualBaseSalary ?? null,
        startDate: displayContract?.startDate ?? null,
        endDate: displayContract?.endDate ?? null,
        contractStatus: displayContract?.status ?? null,

        // giữ full contracts để ContractsTab có thể dùng khi cần
        contracts: b.contracts || [],
      };
    });

    setBarbers(mappedBarbers);

    // ===== 4) Promotion alerts =====
    setPromotionList(promotionRes.data || []);
  } catch (err) {
    console.error("Lỗi tải dữ liệu:", err);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    loadInitialData();
  }, []);

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

  if (isLoading && plans.length === 0) {
    return (
      <div className={cx("page")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
        <Loader size={20} className={cx("spin")} />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className={cx("page")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Nhân sự & Tài chính</div>
          <h1 className={cx("pageTitle")}>Chính sách & KPI</h1>
          <p className={cx("pageDesc")}>Cấu hình cấp bậc, hoa hồng, thưởng KPI và hợp đồng nhân sự</p>
        </div>
      </div>

      <div className={cx("tabs")}>
        {TABS.map((tab) => (
          <button key={tab.id}
            className={cx("tab", { active: activeTab === tab.id })}
            onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "plans" && (
        <PlansTab plans={plans} onSavePlan={handleSavePlan} onReload={loadInitialData} />
      )}

      {activeTab === "rules" && (
        <RulesTab activePlans={activePlans} onReload={loadInitialData} />
      )}

      {activeTab === "contracts" && (
        <ContractsTab
          barbers={barbers}
          activePlans={activePlans}
          promotionList={promotionList}       // ✅
          salaryPeriod={getSalaryPeriod()}    // ✅
          onReload={loadInitialData}
        />
      )}
    </div>
  );
}

export default ChinhSach;
import React, { useEffect, useState } from "react";
import styles from "./Thuong.module.scss";
import { BarberAPI } from "~/apis/barberAPI";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { 
  Loader2, Award, TrendingUp, Target, Coins, Gift, 
  CheckCircle2, ChevronRight, Crown, Users, Star, Wallet
} from "lucide-react";

// ================== Hàm format ==================
const formatCurrency = (num) => Math.round(num || 0).toLocaleString("vi-VN") + "đ";

const formatPercent = (num) => {
  const truncated = Math.floor((num || 0) * 10) / 10;
  return truncated % 1 === 0 ? truncated.toFixed(0) : truncated.toFixed(1);
};

const Thuong = () => {
  const { user, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const idBarber = user?.idUser;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================== Fetch data ==================
  useEffect(() => {
    if (isAuthLoading || !idBarber) {
      if (!isAuthLoading) setLoading(false);
      return;
    }

    const fetchRewardData = async () => {
      setLoading(true);
      try {
        // Gọi API lấy dữ liệu Realtime của thợ trong tháng hiện tại
        const res = await BarberAPI.getReward(idBarber);
        setData(res);
      } catch (err) {
        console.error("Lỗi tải dữ liệu lương thưởng:", err);
        showToast({ text: "Không thể tải dữ liệu lương thưởng. Vui lòng thử lại.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchRewardData();
  }, [idBarber, isAuthLoading]);

  if (isAuthLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={40} className={styles.loadingIcon} />
        <p>Đang tổng hợp dữ liệu lương thưởng...</p>
      </div>
    );
  }

  if (!idBarber) {
    return (
      <div className={styles.emptyContainer}>
        <Award size={48} className={styles.emptyIcon} />
        <p>Vui lòng đăng nhập bằng tài khoản Barber.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.emptyContainer}>
        <Award size={48} className={styles.emptyIcon} />
        <p>Chưa có dữ liệu cho tháng này.</p>
      </div>
    );
  }

  // Phân tích dữ liệu Hoa Hồng Bậc Thang
  const { serviceRevenue, commissionRules } = data;
  let currentRule = null;
  let nextRule = null;

  if (commissionRules && commissionRules.length > 0) {
    currentRule = [...commissionRules].reverse().find(r => serviceRevenue >= r.minRevenueStep);
    nextRule = commissionRules.find(r => serviceRevenue < r.minRevenueStep);
  }

  const currentRate = currentRule ? currentRule.commissionRate : 0;
  const nextTarget = nextRule ? nextRule.minRevenueStep : null;
  const percentToNextCommission = nextTarget 
    ? Math.min((serviceRevenue / nextTarget) * 100, 100) 
    : 100;

  // Tính tổng thu nhập dự kiến
  const estimatedTotal = data.baseSalary + data.commissionAmount + data.tipAmount + data.bonusAmount;

  return (
    <div className={styles.container}>
      {/* ===== HEADER TỔNG QUAN ===== */}
      <div className={styles.headerInfo}>
        <div>
          <h2 className={styles.title}>
            <Wallet className={styles.titleIcon} size={28} /> Bảng Lương & Thưởng Tháng {data.month}/{data.year}
          </h2>
          <p className={styles.subtitle}>Tổng thu nhập tạm tính (Chưa trừ vi phạm/tạm ứng)</p>
          <div className={styles.totalIncome}>{formatCurrency(estimatedTotal)}</div>
        </div>
        <div className={styles.levelBadge}>
          <Crown size={18} /> {data.planName || "Chưa có cấp bậc"}
        </div>
      </div>

      {/* ===== KHỐI 1: DOANH THU & HOA HỒNG ===== */}
      <div className={styles.section}>
        <div className={styles.headerRow}>
          <h3><TrendingUp size={18} /> Doanh Thu & Hoa Hồng</h3>
          <span className={styles.badge}>Mức HH hiện tại: {formatPercent(currentRate)}%</span>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}><Coins size={14} /> Lương cứng</span>
            <b className={styles.statValue}>{formatCurrency(data.baseSalary)}</b>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}><Target size={14} /> Dịch vụ</span>
            <b className={styles.statValue}>{formatCurrency(data.serviceRevenue)}</b>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}><Gift size={14} /> Tiền tip</span>
            <b className={styles.statValue}>{formatCurrency(data.tipAmount)}</b>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}><Award size={14} /> Hoa hồng tạm tính</span>
            <b className={styles.statValue}>{formatCurrency(data.commissionAmount)}</b>
          </div>
        </div>

        {nextRule && (
          <div className={styles.progressBox}>
            <p className={styles.progressText}>
              Còn <strong>{formatCurrency(nextTarget - serviceRevenue)}</strong> nữa để nâng hoa hồng lên <strong>{formatPercent(nextRule.commissionRate)}%</strong>
            </p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${percentToNextCommission}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* ===== KHỐI 2: THƯỞNG KPI (BONUS) ===== */}
      <div className={styles.section}>
        <div className={styles.headerRow}>
          <h3><Target size={18} /> Thưởng Nóng (KPI)</h3>
          <span className={styles.badge}>Đã nhận: {formatCurrency(data.bonusAmount)}</span>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <Users size={20} className={styles.kpiIcon} />
            <div>
              <p className={styles.kpiLabel}>Khách phục vụ</p>
              <p className={styles.kpiValue}>{data.customerCount} lượt</p>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <Star size={20} className={styles.kpiIcon} />
            <div>
              <p className={styles.kpiLabel}>Đánh giá TB</p>
              <p className={styles.kpiValue}>{formatPercent(data.averageRating)} ⭐️</p>
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.rewardTable}>
            <thead>
              <tr>
                <th>Trạng Thái</th>
                <th>Điều kiện Khách</th>
                <th>Điều kiện Rating</th>
                <th>Tiền Thưởng</th>
              </tr>
            </thead>
            <tbody>
              {data.bonusRules && data.bonusRules.length > 0 ? (
                data.bonusRules.map((rule, idx) => {
                  const isReached = data.customerCount >= rule.minCustomerCount && data.averageRating >= parseFloat(rule.minAverageRating);
                  return (
                    <tr key={idx} className={isReached ? styles.reached : styles.notYet}>
                      <td>
                        {isReached ? (
                          <span className={styles.statusReached}><CheckCircle2 size={18} /> Đã Đạt</span>
                        ) : (
                          <span className={styles.statusNotYet}>Chưa Đạt</span>
                        )}
                      </td>
                      <td>{rule.minCustomerCount} lượt</td>
                      <td>Từ {rule.minAverageRating} ⭐️</td>
                      <td className={styles.amountCol}>+{formatCurrency(rule.rewardAmount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="4" className={styles.emptyText}>Chưa có cấu hình thưởng KPI cho cấp bậc này.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Thuong;
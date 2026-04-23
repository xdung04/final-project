import React, { useEffect, useState } from "react";
import styles from "./Thuong.module.scss";
import { BarberAPI } from "~/apis/barberAPI";
import { useAuth } from "~/context/AuthContext";
import { Loader2, Award, TrendingUp, Target, Coins, Gift, CheckCircle2, ChevronRight } from "lucide-react";

// ================== Hàm format ==================
const formatCurrency = (num) =>
  Math.round(num).toLocaleString("vi-VN") + "đ";

// Giữ 1 chữ số thập phân nếu có, không làm tròn lên
const formatPercent = (num) => {
  const truncated = Math.floor(num * 10) / 10;
  return truncated % 1 === 0 ? truncated.toFixed(0) : truncated.toFixed(1);
};

const Thuong = () => {
  const { user, loading: isAuthLoading } = useAuth();
  const idBarber = user?.idUser;

  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================== Fetch reward ==================
  useEffect(() => {
    if (isAuthLoading || !idBarber) {
      if (!isAuthLoading) setLoading(false);
      return;
    }

    const fetchReward = async () => {
      setLoading(true);
      try {
        const data = await BarberAPI.getReward(idBarber);
        setReward(data);
      } catch (err) {
        console.error("Lỗi tải thưởng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReward();
  }, [idBarber, isAuthLoading]);

  // ================== Xử lý loading / không có dữ liệu ==================
  if (isAuthLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={40} className={styles.loadingIcon} />
        <p>Đang tải dữ liệu thưởng...</p>
      </div>
    );
  }

  if (!idBarber) {
    return (
      <div className={styles.emptyContainer}>
        <Award size={48} className={styles.emptyIcon} />
        <p>Vui lòng đăng nhập bằng tài khoản Barber để xem mức thưởng.</p>
      </div>
    );
  }

  if (!reward) {
    return (
      <div className={styles.emptyContainer}>
        <Award size={48} className={styles.emptyIcon} />
        <p>Chưa có dữ liệu thưởng cho tháng này.</p>
      </div>
    );
  }

  const percentRevenue = reward.nextRule
    ? Math.min((reward.serviceRevenue / reward.nextRule.minRevenue) * 100, 100)
    : 100;

  return (
    <div className={styles.container}>
      <div className={styles.headerInfo}>
        <div>
          <h2 className={styles.title}>
            <Award className={styles.titleIcon} size={28} /> Thưởng & Mốc Doanh Thu
          </h2>
          <p className={styles.subtitle}>Thống kê kỳ lương tháng {reward.month}/{reward.year}</p>
        </div>
      </div>

      {/* ===== Doanh thu tháng này ===== */}
      <div className={styles.section}>
        <div className={styles.headerRow}>
          <h3><TrendingUp size={18} /> Doanh thu hiện tại</h3>
          <span className={styles.badge}>{Math.round(percentRevenue)}%</span>
        </div>

        <div className={styles.progressBox}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${percentRevenue}%` }}
            ></div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}><Coins size={14} /> Dịch vụ</span>
              <b className={styles.statValue}>{formatCurrency(reward.serviceRevenue)}</b>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}><Gift size={14} /> Tiền tip</span>
              <b className={styles.statValue}>{formatCurrency(reward.tipAmount)}</b>
            </div>

            {reward.nextRule && (
              <div className={styles.statCard}>
                <span className={styles.statLabel}><Target size={14} /> Mốc tiếp theo</span>
                <b className={styles.statValue}>{formatCurrency(reward.nextRule.minRevenue)}</b>
              </div>
            )}
          </div>
        </div>

        {/* ===== Phần thưởng ===== */}
        <div className={styles.rewardBox}>
          <div className={styles.rewardContent}>
            <p className={styles.rewardLabel}>Phần thưởng hiện tại</p>
            <p className={styles.rewardValue}>
              {formatCurrency(reward.bonus)} <span className={styles.percent}>(+{formatPercent(reward.currentRule.bonusPercent)}%)</span>
            </p>

            {reward.nextRule && (
              <p className={styles.nextMilestone}>
                Đạt <strong className={styles.highlight}>{formatCurrency(reward.nextRule.minRevenue)}</strong> để nhận thưởng <strong className={styles.highlight}>+{formatPercent(reward.nextRule.bonusPercent)}%</strong>
              </p>
            )}
          </div>
          <Gift size={60} className={styles.rewardBgIcon} />
        </div>
      </div>

      {/* ===== Bảng mốc thưởng ===== */}
      <div className={styles.tableSection}>
        <h3>Lộ trình & Mốc thưởng</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.rewardTable}>
            <thead>
              <tr>
                <th>Trạng Thái</th>
                <th>Mốc Doanh Thu</th>
                <th>Tỉ Lệ Thưởng</th>
              </tr>
            </thead>
            <tbody>
              {reward.rewardRules.map((rule, idx) => {
                const reached = reward.serviceRevenue >= rule.minRevenue;
                const isNext = reward.nextRule?.minRevenue === rule.minRevenue;

                return (
                  <tr
                    key={idx}
                    className={
                      reached
                        ? styles.reached
                        : isNext
                          ? styles.next
                          : styles.notYet
                    }
                  >
                    <td>
                      {reached ? (
                        <span className={styles.statusReached}><CheckCircle2 size={18} /> Đã Đạt</span>
                      ) : isNext ? (
                        <span className={styles.statusNext}><ChevronRight size={18} /> Mục Tiêu</span>
                      ) : (
                        <span className={styles.statusNotYet}>Chưa Đạt</span>
                      )}
                    </td>
                    <td className={styles.amountCol}>{formatCurrency(rule.minRevenue)}</td>
                    <td className={styles.percentCol}>{formatPercent(rule.bonusPercent)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Thuong;
import React, { useEffect, useState } from "react";
import styles from "./BarberProfile.module.scss";
import { useParams, useNavigate } from "react-router-dom";
import { BarberAPI } from "~/apis/barberAPI";
import { fetchReelsByBarberId } from "~/services/reelService";
import VideoCard from "~/components/VideoCard";
import VideoDetailDialog from "~/components/VideoDetailDialog";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";

function renderStars(avg) {
  const rounded = Math.round(avg);
  return "★".repeat(Math.min(rounded, 5)) + "☆".repeat(Math.max(0, 5 - rounded));
}

function BarberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLogin, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [barber, setBarber] = useState(null);
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    const loadData = async () => {
      try {
        const [profile, videos] = await Promise.all([
          BarberAPI.getProfile(id),
          fetchReelsByBarberId(id, 1, 20),
        ]);
        setBarber(profile);
        setReels(videos);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu barber:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isAuthLoading]);

  const handleHashtagClick = (tag) => navigate("/reels", { state: { keyword: `#${tag}` } });

  const handleOpenDetail = (idx) => {
    if (!isLogin) {
      showToast({ text: "Vui lòng đăng nhập để xem chi tiết video!", type: "error" });
      return;
    }
    setCurrentIndex(idx);
  };

  const handleLike = (idReel, liked, count) => {
    if (!isLogin) {
      showToast({ text: "Vui lòng đăng nhập để thực hiện hành động này", type: "error" });
      return;
    }
    setReels((prev) => prev.map((r) => (r.idReel === idReel ? { ...r, isLiked: liked, likesCount: count } : r)));
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateWrapper}>
          <p className={styles.stateText}>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className={styles.page}>
        <div className={styles.stateWrapper}>
          <p className={styles.stateText}>Không tìm thấy thợ cắt tóc này.</p>
        </div>
      </div>
    );
  }

  const certList = barber.certificates ? barber.certificates.split("\n").filter((c) => c.trim()) : [];

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />

      {/* ══════════════════════════════════════════════════════════
          PROFILE CARD — 3 cột: ảnh | thông tin cá nhân | chi tiết
      ══════════════════════════════════════════════════════════ */}
      <section className={styles.profileCard}>
        {/* CỘT 1 — Ảnh */}
        <div className={styles.colAvatar}>
          <img src={barber.image || "/default-avatar.png"} alt={barber.fullName} className={styles.avatar} />
        </div>

        {/* CỘT 2 — Tên, chi nhánh, sao, lượt đánh giá, kinh nghiệm, email, SĐT */}
        <div className={styles.colInfo}>
          <p className={styles.branch}>{barber.branchName}</p>
          <h1 className={styles.name}>{barber.fullName}</h1>

          <div className={styles.ratingRow}>
            <span className={styles.stars}>{renderStars(barber.avgRate || 0)}</span>
            <span className={styles.ratingNum}>{Number(barber.avgRate || 0).toFixed(1)}</span>
            <span className={styles.ratingCount}>({barber.totalRate || 0} đánh giá)</span>
          </div>

          <div className={styles.metaList}>
            {barber.experienceYears > 0 && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Kinh nghiệm</span>
                <span className={styles.metaValue}>{barber.experienceYears} năm</span>
              </div>
            )}
            {barber.email && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Email</span>
                <span className={styles.metaValue}>{barber.email}</span>
              </div>
            )}
            {barber.phoneNumber && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Điện thoại</span>
                <span className={styles.metaValue}>{barber.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* CỘT 3 — Chuyên môn, Phong cách, Triết lý, Story, Chứng chỉ */}
        <div className={styles.colDetail}>
          {barber.specialty && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Chuyên môn</span>
              <span className={styles.detailValue}>{barber.specialty}</span>
            </div>
          )}
          {barber.style && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Phong cách</span>
              <span className={styles.detailValue}>{barber.style}</span>
            </div>
          )}
          {barber.philosophy && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Triết lý nghề</span>
              <span className={styles.detailValue}>{barber.philosophy}</span>
            </div>
          )}
          {barber.profileDescription && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Story &amp; Expertise</span>
              <span className={styles.detailValue}>{barber.profileDescription}</span>
            </div>
          )}
          {certList.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Chứng chỉ &amp; Thành tựu</span>
              <ul className={styles.certList}>
                {certList.map((cert, i) => (
                  <li key={i} className={styles.certItem}>
                    <span className={styles.certDot} aria-hidden="true">
                      ◆
                    </span>
                    {cert.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          LOOKBOOK — scroll xuống là reel
      ══════════════════════════════════════════════════════════ */}
      <section className={styles.videoSection} aria-label="Lookbook">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Lookbook &amp; Portfolio</h2>
          {reels.length > 0 && <span className={styles.sectionSub}>{reels.length} tác phẩm</span>}
        </div>

        {reels.length === 0 ? (
          <div className={styles.stateWrapper}>
            <p className={styles.stateText}>Chưa có tác phẩm nào được cập nhật.</p>
          </div>
        ) : (
          <div className={styles.videoGrid}>
            {reels.map((reel, idx) => (
              <VideoCard
                key={reel.idReel}
                reel={reel}
                onToggleLike={handleLike}
                onOpenDetail={() => handleOpenDetail(idx)}
              />
            ))}
          </div>
        )}
      </section>

      {currentIndex !== null && (
        <VideoDetailDialog
          reels={reels}
          currentIndex={currentIndex}
          onChangeVideo={(newIdx) => setCurrentIndex(newIdx)}
          onClose={() => setCurrentIndex(null)}
          globalMuted={globalMuted}
          onToggleLike={handleLike}
          onToggleGlobalMuted={() => setGlobalMuted((prev) => !prev)}
          fromReelPlayer={false}
          onHashtagClick={handleHashtagClick}
        />
      )}
    </div>
  );
}

export default BarberProfile;

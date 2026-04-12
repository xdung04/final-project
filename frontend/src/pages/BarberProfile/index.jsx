import React, { useEffect, useState } from "react";
import styles from "./BarberProfile.module.scss";
import { useParams } from "react-router-dom";
import { BarberAPI } from "~/apis/barberAPI";
import { fetchReelsByBarberId } from "~/services/reelService";
import VideoCard from "~/components/VideoCard";
import VideoDetailDialog from "~/components/VideoDetailDialog";
import { useAuth } from "~/context/AuthContext"; // 🟢 THÊM
import { useToast } from "~/context/ToastContext";
import { useNavigate } from "react-router-dom";

function BarberProfile() {
  const { id } = useParams(); // /barber/:id
  const [barber, setBarber] = useState(null);
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const { accessToken, isLogin, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Hoãn việc tải data cho đến khi AuthContext xác định xong trạng thái
    if (isAuthLoading) return;

    const loadData = async () => {
      try {
        // Tải Profile không cần token (public)
        const profile = await BarberAPI.getProfile(id);

        // Tải Video, TRUYỀN accessToken để lấy trạng thái isLiked chính xác
        const videos = await fetchReelsByBarberId(id, 1, 20, accessToken);

        setBarber(profile);
        setReels(videos);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, accessToken, isAuthLoading]);

  const handleHashtagClick = (tag) => {
  navigate("/reels", {
    state: { keyword: `#${tag}` }
  });
};

  const handleOpenDetail = (idx) => {
    if (!isLogin) {
      showToast({
        text: "Vui lòng đăng nhập để xem chi tiết video!",
        type: "error",
      });
      return;
    }
    setCurrentIndex(idx);
  };

  const handleLike = (idReel, liked, count) => {
    if (!isLogin) {
      showToast({
        text: "Vui lòng đăng nhập để thực hiện hành động này",
        type: "error",
      });
      return;
    }
    setReels((prev) =>
      prev.map((r) =>
        r.idReel === idReel ? { ...r, isLiked: liked, likesCount: count } : r
      )
    );
  };

  if (loading) return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  if (!barber) return <div className={styles.empty}>Không tìm thấy thợ cắt tóc này.</div>;

return (
  <div className={styles.container}>
    {/* Thêm lớp phủ hiệu ứng giấy mỹ thuật */}
    <div className={styles.grainOverlay}></div>

    {/* ===== THÔNG TIN THỢ ===== */}
    <div className={styles.profileSection}>
      <img
        src={barber.image || "/default-avatar.png"}
        alt={barber.fullName}
        className={styles.avatar}
      />
      <div className={styles.info}>
        <p className={styles.branch}>
          {barber.branchName} 
        </p>
        <h2 className={styles.name}>{barber.fullName}</h2>
        
        <div className={styles.contact}>
          <span>📧 {barber.email}</span>
          <span>☎️ {barber.phoneNumber}</span>
        </div>

        <div className={styles.rating}>
          PREMIUM BARBER ★ {barber.avgRate} ({barber.totalRate} REVIEWS)
        </div>

        <div className={styles.descBox}>
          <h3>STORY & EXPERTISE</h3>
          <p className={styles.desc}>{barber.profileDescription}</p>
        </div>
      </div>
    </div>

    {/* ===== VIDEO TAY NGHỀ ===== */}
    <div className={styles.videoSection}>
      <h3 className={styles.videoTitle}>Lookbook & Portfolio</h3>
      {reels.length === 0 ? (
        <div className={styles.empty}>Chưa có tác phẩm nào được cập nhật.</div>
      ) : (
        <div className={styles.grid}>
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
    </div>



      {/* ===== DIALOG XEM VIDEO ===== */}
      {currentIndex !== null && (
        <VideoDetailDialog
          reels={reels}
          currentIndex={currentIndex}
          onChangeVideo={(newIdx) => setCurrentIndex(newIdx)} 
          onClose={() => setCurrentIndex(null)}
          token={accessToken}
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

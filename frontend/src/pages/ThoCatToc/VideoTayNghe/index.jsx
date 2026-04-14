import React, { useState, useEffect } from "react";
import styles from "./VideoTayNghe.module.scss";
import VideoCard from "~/components/VideoCard";
import VideoDetailDialog from "~/components/VideoDetailDialog";
import UploadVideoDialog from "~/components/UploadVideoDialog";
import { fetchReelsByBarberId } from "~/services/reelService";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { useNavigate } from "react-router-dom";

function VideoTayNghe() {

  const { accessToken, user, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const [reels, setReels] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const idBarber = user.idUser; // Add globalMuted state
  const navigate = useNavigate();

  const openDetail = (index) => {
    setCurrentIndex(index);
    setGlobalMuted(false); // Unmute when opening VideoDetailDialog
  };

  const handleHashtagClick = (tag) => {
    navigate("/reels", {
      state: { keyword: `#${tag}` }
    });
  };

  useEffect(() => {
    if (isAuthLoading || !idBarber) {
      setLoading(false);
      return;
    }
    const loadReels = async () => {
      setLoading(true);
      try {
        const data = await fetchReelsByBarberId(idBarber, 1, 20, accessToken);
        setReels(data);
      } catch (error) {
        console.error("Lỗi khi tải reels của Barber:", error);
        showToast({ text: "Không thể tải video, vui lòng thử lại.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    loadReels();
  }, [idBarber, accessToken, isAuthLoading, showToast]);

  const toggleLike = (idReel, isLiked, likesCount) => {
    setReels((prev) =>
      prev.map((r) =>
        r.idReel === idReel
          ? { ...r, isLiked: isLiked, likesCount: likesCount } // Đảm bảo cập nhật cả isLiked và likesCount
          : r
      )
    );
  };

  const handleUpload = (newReel) => {
    setReels([newReel, ...reels]);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Video tay nghề</h2>
      <p className={styles.subtitle}>Upload và quản lý video showcase kỹ năng cắt tóc</p>

      <div className={styles.header}>
        <button className={styles.uploadBtn} onClick={() => setIsUploadOpen(true)}>
          Upload Video
        </button>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <p>Đang tải video...</p>
        ) : reels.length === 0 ? (
          <p className={styles.emptyText}>Không có video nào.</p>
        ) : (
          reels.map((reel, idx) => (
            <VideoCard
              key={reel.idReel}
              reel={reel}
              onToggleLike={toggleLike}
              onOpenDetail={() => openDetail(idx)}
            />
          ))
        )}
      </div>
      {currentIndex !== null && (
        <VideoDetailDialog
          reels={reels}
          currentIndex={currentIndex}
          onChangeVideo={(newIdx) => setCurrentIndex(newIdx)}
          onClose={() => setCurrentIndex(null)}
          onToggleLike={toggleLike}
          token={accessToken}
          globalMuted={globalMuted}
          onToggleGlobalMuted={() => setGlobalMuted((prev) => !prev)}
          fromReelPlayer={false}
          onHashtagClick={handleHashtagClick}
        />
      )}

      <UploadVideoDialog
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}

export default VideoTayNghe;
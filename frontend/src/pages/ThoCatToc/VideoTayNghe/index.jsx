import React, { useState, useEffect } from "react";
import styles from "./VideoTayNghe.module.scss";
import VideoCard from "~/components/VideoCard";
import VideoDetailDialog from "~/components/VideoDetailDialog";
import UploadVideoDialog from "~/components/UploadVideoDialog";
import { fetchReelsByBarberId } from "~/services/reelService";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { useNavigate } from "react-router-dom";
import { Film, UploadCloud, Loader2 } from "lucide-react"; // Thêm icons

function VideoTayNghe() {
  const {  user, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const [reels, setReels] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const idBarber = user?.idUser; 
  const navigate = useNavigate();

  const openDetail = (index) => {
    setCurrentIndex(index);
    setGlobalMuted(false); 
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
        const data = await fetchReelsByBarberId(idBarber, 1, 20);
        setReels(data);
      } catch (error) {
        console.error("Lỗi khi tải reels của Barber:", error);
        showToast({ text: "Không thể tải video, vui lòng thử lại.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    loadReels();
  }, [idBarber,isAuthLoading, showToast]);

  const toggleLike = (idReel, isLiked, likesCount) => {
    setReels((prev) =>
      prev.map((r) =>
        r.idReel === idReel
          ? { ...r, isLiked: isLiked, likesCount: likesCount } 
          : r
      )
    );
  };

  const handleUpload = (newReel) => {
    setReels([newReel, ...reels]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerInfo}>
        <div>
          <h2 className={styles.title}>Video Tay Nghề</h2>
          <p className={styles.subtitle}>Upload và quản lý video showcase kỹ năng cắt tóc</p>
        </div>
        <button className={styles.uploadBtn} onClick={() => setIsUploadOpen(true)}>
          <UploadCloud size={20} />
          Upload Video
        </button>
      </div>

      <div className={styles.gridContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={40} />
            <p>Đang tải danh sách video...</p>
          </div>
        ) : reels.length === 0 ? (
          <div className={styles.emptyState}>
            <Film size={48} className={styles.emptyIcon} />
            <p>Chưa có video nào. Hãy đăng tải tác phẩm đầu tiên của bạn!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {reels.map((reel, idx) => (
              <VideoCard
                key={reel.idReel}
                reel={reel}
                onToggleLike={toggleLike}
                onOpenDetail={() => openDetail(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {currentIndex !== null && (
        <VideoDetailDialog
          reels={reels}
          currentIndex={currentIndex}
          onChangeVideo={(newIdx) => setCurrentIndex(newIdx)}
          onClose={() => setCurrentIndex(null)}
          onToggleLike={toggleLike}
      
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
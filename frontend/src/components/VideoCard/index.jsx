import React from "react";
import styles from "./VideoCard.module.scss";
import { Heart, MessageCircle, Eye } from "lucide-react"; 

function VideoCard({ reel, onToggleLike, onOpenDetail }) {
  const handleOpenDetail = () => {
    onOpenDetail();
  };

  return (
    <div className={styles.reelCard} onClick={handleOpenDetail}>
      <div className={styles.videoBox}>
        {/* Thumbnail video */}
        <img src={reel.thumbnail} alt={reel.title} className={styles.videoThumb} />
        
        {/* 1. VIEW COUNT (Góc dưới trái) */}
        <div className={styles.viewCountFixed}>
            <Eye size={14} className={styles.viewIcon} />
            <span className={styles.viewCountText}>{reel.viewCount || 0}</span>
        </div>

        {/* 2. HOVER OVERLAY: LIKE & COMMENT COUNT */}
        <div className={styles.hoverOverlay}>
            <div className={styles.statItem}>
                <Heart size={24} className={styles.statIcon} fill="currentColor" strokeWidth={1} /> 
                <span className={styles.statCount}>{reel.likesCount || 0}</span>
            </div>
            
            <div className={styles.statItem}>
                <MessageCircle size={24} className={styles.statIcon} fill="currentColor" strokeWidth={1} />
                <span className={styles.statCount}>{reel.commentsCount || 0}</span>
            </div>
        </div>

        {/* Duration (Tùy chọn) */}
        {reel.duration && <span className={styles.duration}>{reel.duration}</span>}
      </div>
    </div>
  );
}

export default VideoCard;
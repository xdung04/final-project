import { Link } from "react-router-dom"; // nhớ thêm dòng này đầu file
import React, { useState, useEffect, useRef } from "react";
import styles from "./VideoDetailDialog.module.scss";
import { useToast } from "~/context/ToastContext";
import {
  likeReel,
  getComments,
  addComment,
  addReply,
  trackReelView,
} from "~/services/reelService";
import { Heart, Share2, ChevronUp, ChevronDown, Send, Volume2, VolumeX } from "lucide-react";

const MIN_VIEW_DURATION_MS = 3000;
const ANIMATION_DURATION_MS = 600;
const ANIMATION_LOCK_MS = 1000;

function VideoDetailDialog({
  reels,
  currentIndex,
  onClose,
  onToggleLike,
  onChangeVideo,
  token,
  globalMuted = true,
  onToggleGlobalMuted = () => { },
  redirectToLogin = () => console.log("Login modal not passed!"),
  fromReelPlayer = false,
  onHashtagClick = () => { }, // 🆕 thêm prop mới
}) {

  const reel = reels[currentIndex];
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeReply, setActiveReply] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [slideDirection, setSlideDirection] = useState(null);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const [showNavButtons, setShowNavButtons] = useState(!fromReelPlayer);
  const [localMuted, setLocalMuted] = useState(globalMuted); // Add localMuted state

  const videoRef = useRef(null);
  const dialogRef = useRef(null);
  const isViewTrackedRef = useRef(false);
  const { showToast } = useToast();

  const handleAction = async (apiCall) => {
    try {
      return await apiCall();
    } catch (err) {
      console.error("Lỗi xác thực/hành động:", err);
      // Xử lý nếu token bị hết hạn/không hợp lệ khi đang sử dụng
      if (err.response?.status === 401) {
        redirectToLogin();
      }
      return null;
    }
  };

  // Đồng bộ muted với globalMuted và fromReelPlayer
  useEffect(() => {
    if (videoRef.current) {
      const shouldMute = fromReelPlayer ? globalMuted : false; // Unmute if not from ReelPlayer
      videoRef.current.muted = shouldMute;
      setLocalMuted(shouldMute);
    }
  }, [globalMuted, currentIndex, fromReelPlayer]);

  // Track view after 3s
  useEffect(() => {
    isViewTrackedRef.current = false;
    const handleTimeUpdate = () => {
      if (
        videoRef.current &&
        videoRef.current.currentTime * 1000 >= MIN_VIEW_DURATION_MS
      ) {
        if (!isViewTrackedRef.current && token) {
          trackReelView(reel.idReel, token).catch(console.error);
          isViewTrackedRef.current = true;
        }
        videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };

    videoRef.current?.addEventListener("timeupdate", handleTimeUpdate);
    return () =>
      videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
  }, [reel, token]);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      const data = await getComments(reel.idReel);
      const map = {};
      const roots = [];
      data.forEach((c) => (map[c.idComment] = { ...c, replies: [] }));
      data.forEach((c) =>
        c.parentCommentId
          ? map[c.parentCommentId]?.replies.push(map[c.idComment])
          : roots.push(map[c.idComment])
      );
      setComments(roots);
    };
    if (reel) loadComments();
  }, [reel]);

  // Click outside dialog to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Xử lý hiệu ứng chuyển tiếp
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => setSlideDirection(null), ANIMATION_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  // Show navigation buttons after first navigation
  useEffect(() => {
    if (fromReelPlayer && slideDirection) {
      setShowNavButtons(true);
    }
  }, [fromReelPlayer, slideDirection]);

  const handleLike = async () => {
    if (!token) return; // Bảo vệ API (mặc dù đã check ở component cha)
    const res = await handleAction(() => likeReel(reel.idReel, token));
    if (res) onToggleLike(reel.idReel, res.liked, res.likesCount);
  };

  const handleAddComment = async () => {
    if (!token) {
      showToast("Bạn cần đăng nhập để bình luận!", "warning");
      return;
    }
    if (!newComment.trim()) {
      showToast("Nội dung bình luận không được để trống!", "warning");
      return;
    }

    const cmt = await handleAction(() =>
      addComment(reel.idReel, newComment, token)
    );

    if (cmt) {
      setComments([...comments, { ...cmt, replies: [] }]);
      setNewComment("");
    }
  };

  const handleAddReply = async (commentId) => {
    if (!token) {
      showToast("Bạn cần đăng nhập để trả lời bình luận!", "warning");
      return;
    }
    if (!newReply.trim()) {
      showToast("Nội dung trả lời không được để trống!", "warning");
      return;
    }

    const rep = await handleAction(() =>
      addReply(commentId, newReply, token)
    );

    if (rep) {
      // rep.User đã có fullName + image
      setComments(
        comments.map((c) =>
          c.idComment === commentId
            ? { ...c, replies: [...(c.replies || []), rep] }
            : c
        )
      );
      setNewReply("");
      setActiveReply(null);
    }
  };


  const handleEnded = () => {
    if (currentIndex < reels.length - 1) {
      handleNavClick("down");
    }
  };

  const handleNavClick = (direction) => {
    if (isScrollLocked) return;
    const canNav = direction === "down" ? currentIndex < reels.length - 1 : currentIndex > 0;
    if (!canNav) return;
    setSlideDirection(direction);
    onChangeVideo(direction === "down" ? currentIndex + 1 : currentIndex - 1);
    setIsScrollLocked(true);
    setTimeout(() => setIsScrollLocked(false), ANIMATION_LOCK_MS);
  };

  return (
    <div className={`${styles.overlay} ${slideDirection === "up" ? styles.slideUp : slideDirection === "down" ? styles.slideDown : ""}`}>
      <div className={styles.dialog} ref={dialogRef}>
        {/* 🎬 Video Section */}
        <div className={styles.videoSection}>
          <video
            ref={videoRef}
            src={reel.url}
            controls
            autoPlay
            loop
            playsInline
            muted={localMuted}
            onEnded={handleEnded}
          />
          <button className={styles.closeBtn} onClick={onClose}>
            ✖
          </button>

          {/* 🔊 Nút bật/tắt âm thanh */}
          <button
            className={styles.soundToggle}
            onClick={() => {
              setLocalMuted((prev) => !prev);
              onToggleGlobalMuted();
            }}
            title={localMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {localMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>

          {/* ✅ Navigation Buttons */}
          {showNavButtons && (
            <div className={styles.navContainer}>
              <button
                className={`${styles.navBtn} ${styles.prevBtn} ${currentIndex === 0 ? styles.navDisabled : ""}`}
                disabled={currentIndex === 0 || isScrollLocked}
                onClick={() => handleNavClick("up")}
              >
                <ChevronUp size={24} />
              </button>
              <button
                className={`${styles.navBtn} ${styles.nextBtn} ${currentIndex === reels.length - 1 ? styles.navDisabled : ""}`}
                disabled={currentIndex === reels.length - 1 || isScrollLocked}
                onClick={() => handleNavClick("down")}
              >
                <ChevronDown size={24} />
              </button>
            </div>
          )}
        </div>

        {/* 📝 Info + Comments */}
        <div className={styles.infoSection}>
          <div className={styles.header}>
            <Link
              to={`/barber/${reel.Barber?.idBarber}`}
              className={styles.reelMeta}
              onClick={onClose} // ✅ Đóng dialog trước khi điều hướng
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <img
                src={reel.Barber?.user?.image || "/user.png"}
                alt="avatar"
                className={styles.authorAvatar}
              />
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>
                  {reel.Barber?.user?.fullName || "Barber ẩn danh"}
                </span>
                <span className={styles.postTime}>
                  {new Date(reel.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </Link>
          </div>

          <div className={styles.titleSection}>
            <h3 className={styles.reelTitle}>
              {reel.title
                ? reel.title.split(/(\s+)/).map((word, i) =>
                  word.startsWith("#") ? (
                    <span
                      key={i}
                      className={styles.hashtag}
                      onClick={() => {
                        onClose(); // 🆕 Đóng dialog trước
                        setTimeout(() => onHashtagClick(word.substring(1)), 300); // Gọi tìm kiếm hashtag sau 0.3s
                      }}
                      style={{ color: "#1DA1F2", cursor: "pointer" }}
                    >
                      {word}
                    </span>
                  ) : (
                    word
                  )
                )
                : "Không có tiêu đề"}
            </h3>
          </div>


          <div className={styles.descriptionBox}>
            <pre className={styles.desc}>{reel.description || "Chưa có mô tả chi tiết"}</pre>
          </div>

          <div className={styles.commentsContainer}>
            <h4>Bình luận ({reel.commentsCount})</h4>
            <div className={styles.commentList}>
              {comments.map((cmt) => (
                <div key={cmt.idComment} className={styles.comment}>
                  <div className={styles.cmtHeader}>
                    <img
                      src={cmt.User?.image || "/user.png"}
                      alt="avatar"
                      className={styles.avatar}
                    />
                    <div className={styles.cmtInfo}>
                      <div className={styles.cmtAuthorTime}>
                        <span className={styles.author}>
                          {cmt.User?.fullName || "Ẩn danh"}
                        </span>
                        <span className={styles.time}>
                          {new Date(cmt.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={styles.content}>{cmt.content}</p>
                    </div>
                  </div>

                  <button
                    className={styles.replyBtn}
                    onClick={() => setActiveReply(cmt.idComment)}
                  >
                    Trả lời
                  </button>

                  {cmt.replies.length > 0 && (
                    <div className={styles.replies}>
                      {cmt.replies.map((rep) => (
                        <div key={rep.idComment} className={styles.reply}>
                          <img
                            src={rep.User?.image || "/user.png"}
                            alt="avatar"
                            className={styles.avatarSmall}
                          />
                          <div className={styles.replyText}>
                            <span className={styles.author}>
                              {rep.User?.fullName || "Ẩn danh"}
                            </span>
                            <p className={styles.replyContent}>{rep.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeReply === cmt.idComment && (
                    <div className={styles.replyForm}>
                      <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder={`Trả lời ${cmt.User?.fullName || "bình luận"
                          }...`}
                      />
                      <button
                        onClick={() => handleAddReply(cmt.idComment)}
                        disabled={!newReply.trim()}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footerActions}>
            <div className={styles.reelActions}>
              <button
                className={styles.likeBtn}
                onClick={handleLike}
                style={{ color: reel.isLiked ? "red" : "#333" }}
              >
                <Heart
                  size={24}
                  fill={reel.isLiked ? "red" : "none"}
                  strokeWidth={reel.isLiked ? 0 : 2}
                />
                <span>{reel.likesCount || 0}</span>
              </button>
              <button
                className={styles.shareBtn}
                onClick={() =>
                  navigator.clipboard.writeText(window.location.href)
                }
              >
                <Share2 size={20} />
                <span>Chia sẻ</span>
              </button>
            </div>

            <div className={styles.addComment}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Thêm bình luận..."
              />
              <button onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoDetailDialog;